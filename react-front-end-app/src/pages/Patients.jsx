import { useState } from "react";
import { Link } from "react-router";
import { addPatient, getPatients } from "../services/patientService";
import LoadError from "../components/LoadError";
import { useAsyncData } from "../hooks/useAsyncData";
import styles from "./Patients.module.css";

const Patients = () => {
    const { data: patientList, error, loading, reload, setData } = useAsyncData(
        (signal) => getPatients({ signal }), []);

    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [standingConcerns, setStandingConcerns] = useState("");
    const [adding, setAdding] = useState(false);

    // Collapsed by default: the roster is what this page is for, and the create
    // form pushed it below the fold.
    const [showAdd, setShowAdd] = useState(false);
    const [addError, setAddError] = useState(null);

    async function handleAddPatient(event) {
        event.preventDefault();
        setAddError(null);
        setAdding(true);

        try {
            const patient = await addPatient({ name, address, phone, standingConcerns });
            setData((roster) => [...roster, patient]);
            setName("");
            setAddress("");
            setPhone("");
            setStandingConcerns("");
            setShowAdd(false);
        } catch (error) {
            setAddError(error.message);
        } finally {
            setAdding(false);
        }
    }

    if (error) return (
        <LoadError
            message={`The patient roster could not load. ${error.message}`}
            onRetry={reload}
        />
    );

    if (loading) return <p>Loading...</p>

    return (
        <section className={styles.patients}>
            <div className={styles.headerRow}>
                <h3 className={styles.title}>Patients</h3>
                <button
                    type="button"
                    className={styles.toggleButton}
                    onClick={() => setShowAdd((open) => !open)}
                    aria-expanded={showAdd}
                    aria-controls="add-patient-form"
                >
                    {showAdd ? "Cancel" : "Add a patient"}
                </button>
            </div>

            {showAdd && (
            <form id="add-patient-form" className={styles.addForm} onSubmit={handleAddPatient}>
                <fieldset className={styles.formFields} disabled={adding} aria-label="New patient details">
                    <div className={styles.fieldRow}>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor="patient-name">Full name</label>
                            <input
                                id="patient-name"
                                type="text"
                                className={styles.fieldInput}
                                required
                                maxLength={255}
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor="patient-phone">Phone (optional)</label>
                            <input
                                id="patient-phone"
                                type="tel"
                                className={styles.fieldInput}
                                maxLength={255}
                                value={phone}
                                onChange={(event) => setPhone(event.target.value)}
                            />
                        </div>
                    </div>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor="patient-address">Address</label>
                        <input
                            id="patient-address"
                            type="text"
                            className={styles.fieldInput}
                            required
                            maxLength={255}
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor="patient-concerns">Standing concerns (optional)</label>
                        <textarea
                            id="patient-concerns"
                            className={styles.fieldInput}
                            rows={3}
                            maxLength={2000}
                            placeholder="What they need help with in general"
                            value={standingConcerns}
                            onChange={(event) => setStandingConcerns(event.target.value)}
                        />
                    </div>
                </fieldset>
                {addError && <p className={styles.errorNote} role="alert">{addError}</p>}
                <button type="submit" className={styles.addButton} disabled={adding}>
                    {adding ? "Adding..." : "Add Patient"}
                </button>
            </form>
            )}

            {patientList.length === 0 ? (
                <p className={styles.emptyState}>
                    No patients yet. Add your first patient above to start
                    their care record.
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
