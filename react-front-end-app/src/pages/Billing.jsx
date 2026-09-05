import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getVisits, submitClaim } from "../services/visitService";
import { formatDateTime, formatCurrency, hoursBetween } from "../utils/format";
import LoadError from "../components/LoadError";
import styles from "./Billing.module.css";
import { VISIT_STATUS } from "../utils/status";
import { sumCost } from "../utils/visits";

const Billing = () => {

    const [ readyToBillVisits, setReadyToBill] = useState(null);
    const [ billedVisits, setBilled ] = useState([]);
    // loading guardrail
    const [ loading, setLoading ] = useState(true);
    // id of the claim currently in flight, or null; drives the row's pending state
    const [ submittingId, setSubmittingId ] = useState(null);
    const [ submitError, setSubmitError ] = useState(null);
    const [ submitSuccess, setSubmitSuccess ] = useState(null);
    const [ loadError, setLoadError ] = useState(null);
    const [ reloadKey, setReloadKey ] = useState(0);

    useEffect(() => {
        async function fetchVisits () {
            try {
                const results = await getVisits();
                setReadyToBill(results.filter((visit) => visit.status === VISIT_STATUS.READY_TO_BILL));
                setBilled(results.filter((visit) => visit.status === VISIT_STATUS.BILLED));
                setLoadError(null);
            } catch (err) {
                setLoadError(err.message);
            } finally {
                // finally, so a failed load stops loading too. Leaving the
                // flag set would trade a wrong page for a permanent spinner.
                setLoading(false);
            }
        }

        fetchVisits();

    }, [reloadKey])

    // auto-dismiss the success banner; cleanup cancels the old timer if a
    // new submit replaces the message or the page unmounts
    useEffect(() => {
        if (!submitSuccess) return;
        const timer = setTimeout(() => setSubmitSuccess(null), 7000);
        return () => clearTimeout(timer);
    }, [submitSuccess])

    async function handleSubmitClaim(id) {
        setSubmitError(null);
        setSubmitSuccess(null);
        setSubmittingId(id);
        try {
            const billedVisit = await submitClaim(id);
            // move it: out of ready-to-bill, into billed (newest on top)
            setReadyToBill((prev) => prev.filter((visit) => visit.id !== id));
            setBilled((prev) => [billedVisit, ...prev]);
            setSubmitSuccess(
                `Claim ${billedVisit.claimId} submitted for ${billedVisit.patientName} (${formatCurrency(billedVisit.estimatedCost)})`
            );
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setSubmittingId(null);
        }
    }

    if (loading) return <p>Loading...</p>

    if (loadError) return (
        <LoadError
            message={`Billing could not load. ${loadError}`}
            onRetry={() => { setLoading(true); setReloadKey((key) => key + 1); }}
        />
    );

    return (
        <section className={styles.billing}>
            <h3>Billing</h3>

            {submitError && <p className={styles.errorNote}>{submitError}</p>}
            {submitSuccess && <p className={styles.successNote}>{submitSuccess}</p>}

            <h4 className={styles.subheading}>Ready to bill</h4>
            {readyToBillVisits.length === 0 ? (
                <p className={styles.emptyState}>
                    No visits are ready to bill yet. Verified visits appear
                    here once their evidence is complete.
                </p>
            ) : (
                <table className={styles.claimsTable}>
                    <thead>
                        <tr>
                            <th>Patient</th>
                            <th>Date</th>
                            <th className={styles.amountCol}>Hours</th>
                            <th className={styles.amountCol}>Amount</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {readyToBillVisits.map((visit) => (
                            <tr key={visit.id}>
                                <td>
                                    <Link to={`/visits/${visit.id}`} className={styles.patientLink}>
                                        {visit.patientName}
                                    </Link>
                                </td>
                                <td>{formatDateTime(visit.appointmentTime)}</td>
                                <td className={styles.amountCol}>
                                    {hoursBetween(visit.checkInTime, visit.checkOutTime)}
                                </td>
                                <td className={styles.amountCol}>
                                    {formatCurrency(visit.estimatedCost)}
                                </td>
                                <td className={styles.actionCol}>
                                    <button
                                        type="button"
                                        className={styles.submitButton}
                                        onClick={() => handleSubmitClaim(visit.id)}
                                        disabled={submittingId === visit.id}
                                    >
                                        {submittingId === visit.id ? "Submitting..." : "Submit claim"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={3}>
                                Total ({readyToBillVisits.length} visit{readyToBillVisits.length > 1 ? "s" : ""})
                            </td>
                            <td className={styles.amountCol}>{formatCurrency(sumCost(readyToBillVisits))}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            )}

            {billedVisits.length > 0 && (
                <>
                    <h4 className={styles.subheading}>Submitted claims</h4>
                    <table className={styles.claimsTable}>
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Claim ref</th>
                                <th>Submitted</th>
                                <th className={styles.amountCol}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {billedVisits.map((visit) => (
                                <tr key={visit.id}>
                                    <td>
                                        <Link to={`/visits/${visit.id}`} className={styles.patientLink}>
                                            {visit.patientName}
                                        </Link>
                                    </td>
                                    <td className={styles.claimRef}>{visit.claimId}</td>
                                    <td>{formatDateTime(visit.submittedAt)}</td>
                                    <td className={styles.amountCol}>
                                        {formatCurrency(visit.estimatedCost)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3}>
                                    Total ({billedVisits.length} claim{billedVisits.length > 1 ? "s" : ""})
                                </td>
                                <td className={styles.amountCol}>{formatCurrency(sumCost(billedVisits))}</td>
                            </tr>
                        </tfoot>
                    </table>
                </>
            )}
        </section>
    );
}

export default Billing;
