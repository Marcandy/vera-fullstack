import { useState } from "react";
import { Link } from "react-router";
import styles from "./Caregivers.module.css";
import { addCaregiver, getCaregivers } from "../services/caregiverService";
import { documentSummary, isClearedToWork } from "../utils/documents";
import { DOCUMENT_STATUS } from "../utils/status";
import { useNow } from "../hooks/useNow";
import { useAsyncData } from "../hooks/useAsyncData";
import LoadError from "../components/LoadError";

// One line telling Denise what is wrong with this caregiver's paperwork,
// without making her read four rows to find out. The detail page is where
// the documents themselves live now.
const paperworkLine = (caregiver, now) => {
    const summary = documentSummary(caregiver, now);

    const problems = [
        summary[DOCUMENT_STATUS.EXPIRED] && `${summary[DOCUMENT_STATUS.EXPIRED]} expired`,
        summary[DOCUMENT_STATUS.PENDING] && `${summary[DOCUMENT_STATUS.PENDING]} outstanding`,
        summary[DOCUMENT_STATUS.EXPIRING] && `${summary[DOCUMENT_STATUS.EXPIRING]} expiring soon`,
    ].filter(Boolean);

    return problems.length === 0
        ? `All ${summary.total} documents current`
        : problems.join(" · ");
};

const Caregivers = () => {
    // The roster read goes through the hook. The add-caregiver form keeps its
    // own state because a form submission is not a page load: it has a pending
    // flag, an inline error and a result that is merged into the list rather
    // than refetched.
    const { data: caregiverList, error: loadError, loading, reload, setData } = useAsyncData(
        (signal) => getCaregivers({ signal }), []);

    const [error, setError] = useState(null);
    const [adding, setAdding] = useState(false);
    const [firstLast, setFirstLast] = useState("");
    const [phone, setPhone] = useState("");

    // Clearance and the expiring count are derived from the clock, so this
    // page ticks for the same reason the dashboard does.
    const now = useNow();

    async function handleAddCaregiver(e) {
        e.preventDefault();
        setError(null);
        setAdding(true);
        try {
            const newCaregiver = await addCaregiver({ name: firstLast, phone});
            // Appended to the list we already hold rather than kept beside it.
            // A second array layered over the fetched one is two sources for one
            // list, and they disagree the moment anything refetches.
            setData((roster) => [...roster, newCaregiver]);
            setFirstLast("");
            setPhone("");
        } catch(err) {
            setError(err.message);
        } finally {
            setAdding(false);
        }
    }

    if (loadError) return (
        <LoadError
            message={`The caregiver roster could not load. ${loadError.message}`}
            onRetry={reload}
        />
    );

    if (loading) return (<p>Loading...</p>);

    return (
        <section className={styles.caregivers}>
            <h3 className={styles.title}>Caregivers</h3>

            <form className={styles.addForm} onSubmit={handleAddCaregiver}>
                <h4 className={styles.addTitle}>Add a caregiver</h4>
                <div className={styles.fieldRow}>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor="name">Full name</label>
                        <input
                            id="name"
                            type="text"
                            className={styles.fieldInput}
                            placeholder="First and last name"
                            value={firstLast}
                            onChange={(e) => setFirstLast(e.target.value)}
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.fieldLabel} htmlFor="phone">Phone</label>
                        <input
                            id="phone"
                            type="tel"
                            className={styles.fieldInput}
                            placeholder="215-555-0100"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                </div>
                {error && <p className={styles.errorNote}>{error}</p>}
                <button type="submit" className={styles.addButton} disabled={adding}>
                    {adding ? "Adding..." : "Add Caregiver"}
                </button>
            </form>

            {caregiverList.length === 0 ? (
                <p className={styles.emptyState}>
                    No caregivers yet. Add your first caregiver above to start
                    tracking their onboarding documents and see who is cleared
                    to work.
                </p>
            ) : (
                <ul className={styles.roster}>
                    {caregiverList.map((caregiver) => {
                        const cleared = isClearedToWork(caregiver, now);

                        return (
                            <li key={caregiver.id}>
                                <Link to={`/caregivers/${caregiver.id}`} className={styles.cardLink}>
                                    <article className={styles.caregiverCard}>
                                        <div className={styles.cardHeader}>
                                            <h4 className={styles.caregiverName}>{caregiver.name}</h4>
                                            <span className={cleared ? styles.clearedBadge : styles.notClearedBadge}>
                                                {cleared ? "Cleared to work" : "Not cleared to work"}
                                            </span>
                                        </div>
                                        <p className={styles.caregiverPhone}>{caregiver.phone}</p>
                                        <p className={styles.paperwork}>{paperworkLine(caregiver, now)}</p>
                                    </article>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
};

export default Caregivers;
