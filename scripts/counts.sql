SELECT 'patients', COUNT(*) FROM patients
UNION ALL SELECT 'caregivers', COUNT(*) FROM caregivers
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'visits', COUNT(*) FROM visits
UNION ALL SELECT 'documents', COUNT(*) FROM documents
UNION ALL SELECT 'claims', COUNT(*) FROM claims
UNION ALL SELECT 'migration_failures', COUNT(*) FROM flyway_schema_history WHERE success=0
UNION ALL SELECT 'orphan_visits', COUNT(*) FROM visits v
    LEFT JOIN patients p ON p.id=v.patient_id LEFT JOIN caregivers c ON c.id=v.caregiver_id
    WHERE p.id IS NULL OR c.id IS NULL
UNION ALL SELECT 'orphan_documents', COUNT(*) FROM documents d
    LEFT JOIN caregivers c ON c.id=d.caregiver_id WHERE c.id IS NULL
UNION ALL SELECT 'orphan_claims', COUNT(*) FROM claims cl
    LEFT JOIN visits v ON v.id=cl.visit_id WHERE v.id IS NULL
UNION ALL SELECT 'orphan_accounts', COUNT(*) FROM users u
    LEFT JOIN caregivers c ON c.id=u.caregiver_id WHERE u.caregiver_id IS NOT NULL AND c.id IS NULL;
