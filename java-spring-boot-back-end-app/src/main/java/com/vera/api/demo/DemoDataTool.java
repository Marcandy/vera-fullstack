package com.vera.api.demo;

import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Map;
import java.util.Properties;

import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;

/** Operator entry point, never a Spring bean or an HTTP endpoint. */
public final class DemoDataTool {
    private DemoDataTool() {
    }

    public static void main(String[] args) {
        try {
            run(args, System.getenv());
        } catch (Exception exception) {
            // Driver errors can contain connection parameters. Keep credentials and
            // SQL out of operator logs; a failed write is rolled back by run().
            String detail = exception instanceof IllegalArgumentException || exception instanceof IllegalStateException
                    ? exception.getMessage() : "Check database access, TLS, and the deployment runbook.";
            System.err.println("Demo operation failed (" + exception.getClass().getSimpleName() + "): " + detail);
            System.exit(1);
        }
    }

    static void run(String[] args, Map<String, String> env) throws Exception {
        if (args.length != 2 || !Arrays.asList("bootstrap", "reset", "verify").contains(args[0])
                || !args[1].equals("--confirm=vera_demo")) {
            throw new IllegalArgumentException("Use bootstrap|reset|verify --confirm=vera_demo");
        }
        String action = args[0];
        if (action.equals("reset") && !"true".equals(env.get("DEMO_APP_STOPPED"))) {
            throw new IllegalArgumentException("Stop the application before resetting its database");
        }

        String host = required(env, "MYSQL_HOST");
        int port = Integer.parseInt(required(env, "MYSQL_PORT"));
        if (!host.matches("[A-Za-z0-9.-]+") || port < 1 || port > 65535) {
            throw new IllegalArgumentException("Invalid database address");
        }
        Properties properties = new Properties();
        properties.setProperty("user", required(env, "MYSQL_USER"));
        properties.setProperty("password", required(env, "MYSQL_PASSWORD"));
        properties.setProperty("trustCertificateKeyStoreUrl", "file:/tmp/vera-aiven.p12");
        properties.setProperty("trustCertificateKeyStoreType", "PKCS12");
        properties.setProperty("trustCertificateKeyStorePassword", "changeit");
        String url = "jdbc:mysql://" + host + ":" + port
                + "/vera_demo?sslMode=VERIFY_IDENTITY&serverTimezone=UTC&connectTimeout=5000&socketTimeout=15000";
        try (Connection connection = DriverManager.getConnection(url, properties)) {
            if (!"vera_demo".equals(connection.getCatalog())) {
                throw new IllegalArgumentException("Only the dedicated vera_demo database is supported");
            }
            if (action.equals("verify")) {
                verify(connection);
                return;
            }
            connection.setAutoCommit(false);
            try {
                if (action.equals("bootstrap")) {
                    for (String table : new String[] {"users", "patients", "caregivers", "visits", "claims", "documents"}) {
                        if (count(connection, table) != 0) {
                            throw new IllegalStateException("Bootstrap requires empty application tables");
                        }
                    }
                } else {
                    // DML only: unlike TRUNCATE, these deletes participate in rollback.
                    execute(connection, "DELETE FROM claims");
                    execute(connection, "DELETE FROM visits");
                    execute(connection, "DELETE FROM documents");
                    execute(connection, "DELETE FROM patients WHERE id NOT BETWEEN 1 AND 10");
                    execute(connection, "DELETE FROM caregivers WHERE id NOT BETWEEN 1 AND 5 "
                            + "AND id NOT IN (SELECT caregiver_id FROM users WHERE caregiver_id IS NOT NULL)");
                }
                ScriptUtils.executeSqlScript(connection, new ClassPathResource("demo/fixtures.sql"));
                // Both caregiver accounts need a scheduled visit and a signature example.
                execute(connection, "UPDATE documents SET signature=NULL,received_at=NULL "
                        + "WHERE caregiver_id IN (1,2) AND name='Background Check'");
                execute(connection, "UPDATE documents SET expires_at=UTC_TIMESTAMP()+INTERVAL 18 DAY "
                        + "WHERE caregiver_id=2 AND name='CPR Certification'");
                execute(connection, "INSERT INTO visits (patient_id,caregiver_id,appointment_time,status,service_type,estimated_cost) "
                        + "VALUES (2,2,UTC_TIMESTAMP()+INTERVAL 30 MINUTE,'SCHEDULED','HOMEMAKER',40.00)");
                execute(connection, "INSERT INTO visits (patient_id,caregiver_id,appointment_time,status,service_type,estimated_cost,"
                        + "check_in_time,check_out_time,assessment) VALUES "
                        + "(2,2,UTC_TIMESTAMP()-INTERVAL 2 HOUR,'NEEDS_REVIEW','HOMEMAKER',40.00,"
                        + "UTC_TIMESTAMP()-INTERVAL 2 HOUR,UTC_TIMESTAMP()-INTERVAL 1 HOUR,'Prepared a meal and assisted with the daily routine.')");
                if (action.equals("bootstrap")) {
                    account(connection, "denise@agency.com", "Denise Carter", "ADMIN", null,
                            required(env, "DEMO_ADMIN_PASSWORD"));
                    account(connection, "marcus@agency.com", "Marcus Reed", "CAREGIVER", 1L,
                            required(env, "DEMO_CAREGIVER_PASSWORD"));
                    account(connection, "dana@agency.com", "Dana Alvarez", "CAREGIVER", 2L,
                            required(env, "DEMO_SECOND_CAREGIVER_PASSWORD"));
                }
                verify(connection);
                connection.commit();
                System.out.println("Demo " + action + " committed. Existing account credentials are preserved on reset.");
            } catch (Exception exception) {
                connection.rollback();
                throw exception;
            }
        }
    }

    private static void account(Connection connection, String email, String name, String role,
            Long caregiverId, String password) throws SQLException {
        int bytes = password.getBytes(StandardCharsets.UTF_8).length;
        if (password.length() < 16 || bytes > 72) {
            throw new IllegalArgumentException("Demo passwords must contain 16 characters and at most 72 UTF-8 bytes");
        }
        String hash = PasswordEncoderFactories.createDelegatingPasswordEncoder().encode(password);
        try (var statement = connection.prepareStatement("INSERT INTO users "
                + "(email,password_hash,name,role,caregiver_id,enabled) VALUES (?,?,?,?,?,true)")) {
            statement.setString(1, email);
            statement.setString(2, hash);
            statement.setString(3, name);
            statement.setString(4, role);
            statement.setObject(5, caregiverId);
            statement.executeUpdate();
        }
    }

    private static void verify(Connection connection) throws SQLException {
        for (String table : new String[] {"patients", "caregivers", "users", "visits", "documents", "claims"}) {
            System.out.println(table + "=" + count(connection, table));
        }
        try (var statement = connection.createStatement(); var result = statement.executeQuery(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE success=0")) {
            result.next();
            if (result.getLong(1) != 0) throw new IllegalStateException("Migration requires operator attention");
        }
    }

    private static long count(Connection connection, String table) throws SQLException {
        // Callers pass only the fixed table names above, never operator input.
        try (var statement = connection.createStatement();
                var result = statement.executeQuery("SELECT COUNT(*) FROM " + table)) {
            result.next();
            return result.getLong(1);
        }
    }

    private static void execute(Connection connection, String sql) throws SQLException {
        try (var statement = connection.createStatement()) {
            statement.executeUpdate(sql);
        }
    }

    private static String required(Map<String, String> env, String name) {
        String value = env.get(name);
        if (value == null || value.isBlank()) throw new IllegalArgumentException("Missing " + name);
        return value;
    }
}
