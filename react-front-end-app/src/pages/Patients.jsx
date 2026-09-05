import { Link } from "react-router";
import { getPatients } from "../services/patientService";
import LoadError from "../components/LoadError";
import { useAsyncData } from "../hooks/useAsyncData";
import styles from "./Patients.module.css";

const Patients = () => {
    const { data: patientList, error, loading, reload } = useAsyncData(
        (signal) => getPatients({ signal }), []);

    if (error) return (
        <LoadError
            message={`The patient roster could not load. ${error.message}`}
            onRetry={reload}
        />
    );

    if (loading) return <p>Loading...</p>

    return (
        <section className={styles.patients}>
            <h3 className={styles.title}>Patients</h3>

            {patientList.length === 0 ? (
                <p className={styles.emptyState}>
                    No patients yet. Patients appear here once they are on the
                    schedule.
                </p>
            ) : (
                <ul className={styles.roster}>
                    {patientList.map((patient) => (
                        <li key={patient.id}>
                            <Link to={`/patients/${patient.id}`} className={styles.cardLink}>
                                <article className={styles.patientCard}>
                                    <h4 className={styles.patientName}>{patient.name}</h4>
                                    <p className={styles.address}>{patient.address}</p>
                                    <p className={styles.phone}>{patient.phone}</p>
                                </article>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default Patients;
