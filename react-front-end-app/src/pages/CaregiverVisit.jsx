import { useState } from "react";
import { useParams, Link } from "react-router";
import StatusPill from "../components/StatusPill";
import { checkInVisit, checkOutVisit, getVisitById, supplyEvidence } from "../services/visitService";
import { getPatientById } from "../services/patientService";
import { useSession } from "../context/sessionContext";
import { hasRole, ROLES } from "../utils/roles";
import styles from "./CaregiverVisit.module.css";
import SignatureField from "../components/SignatureField";
import LoadError from "../components/LoadError";
import { useAsyncData } from "../hooks/useAsyncData";
import { formatDateTime, formatTime, formatLocation } from "../utils/format";
import { VISIT_STATUS } from "../utils/status";
import { getCurrentLocation } from "../services/locationService";

// Evidence fields for the needs-review supply panel, in pipeline order.
// Duplicated from VisitDetail for now; extraction is a parked card.
const EVIDENCE_LABELS = [
    { field: "checkInTime", label: "Check-in time" },
    { field: "checkOutTime", label: "Check-out time" },
    { field: "assessment", label: "Visit assessment" },
    { field: "signature", label: "Patient signature" },
];

const CaregiverVisit = () => {
    const { visitId } = useParams();
    const { user } = useSession();

    // This page is reached from two directions, so back means two things. An
    // admin arrived from the visit's read surface; a caregiver arrived from
    // their own day and has no nav entry for the admin visit list at all.
    const isAdmin = hasRole(user, ROLES.ADMIN);

    // setData is how each mutation writes its result back. Check-in, check-out
    // and supplying evidence all return the updated visit, so there is nothing
    // to refetch: asking again would spend a round trip to be told what we were
    // just handed.
    const { data: visit, error: loadError, loading, reload, setData: setVisit } = useAsyncData(
        (signal) => getVisitById(Number(visitId), { signal }), [visitId]);

    const [error, setError] = useState(null);
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);

    const [assessment, setAssessment] = useState("");
    const [signature, setSignature] = useState("");
    const [confirmNoSignature, setConfirmNoSignature] = useState(false);


    // The patient is a SECOND read, and it waits on the first: the visit is what
    // knows which patient this is, so it is skipped until there is an id. Its
    // failure is deliberately silent, which is why only `data` is taken here.
    // Marcus is standing on a doorstep, and losing the check-in button because
    // an address could not load would be the worse outcome.
    const { data: patient } = useAsyncData(
        (signal) => getPatientById(visit.patientId, { signal }),
        [visit?.patientId],
        { skip: !visit?.patientId });

    async function handleCheckIn () {
        setError(null);
        setCheckingIn(true);
        try {
            // Ask the device first, then hand the answer to the service. This
            // never throws and never blocks: a refused or unreachable fix still
            // checks the caregiver in, it just records that it was not captured.
            const location = await getCurrentLocation();
            const newVisit = await checkInVisit(visit.id, location);
            setVisit(newVisit)
        } catch (err) {
            setError(err.message);
        } finally {
            setCheckingIn(false);
        }
    }

    async function handleCheckOut(e) {
        e.preventDefault();
        setError(null);

        //flag at door first to warn about submission without signature
        if (!signature.trim() && !confirmNoSignature) {
            setConfirmNoSignature(true);
            return;
        }

        setCheckingOut(true);
        try {
            const checkOutData = await checkOutVisit(visit.id, {assessment, signature});
            setVisit(checkOutData);
        } catch(err) {
            setError(err.message);
        } finally {
            setCheckingOut(false);
        }
    }

    async function handleSupplyEvidence(e) {
        e.preventDefault();
        setError(null);

        setCheckingOut(true);
        try {
            const updated = await supplyEvidence(visit.id, { assessment, signature });
            setVisit(updated);
        } catch (err) {
            setError(err.message);
        } finally {
            setCheckingOut(false);
        }
    }

    if (loading) return (<p>Loading...</p>);

    // A caregiver standing at a door needs to know the difference between
    // "this visit is not yours" and "we could not reach the office".
    if (loadError) return (
        <LoadError
            message={`This visit could not load. ${loadError.message}`}
            onRetry={reload}
        />
    );

    if (!visit) return (<p>Visit not found. <Link to="/visits">Back to visits</Link></p>);

    const missingSignature = !signature.trim();
    const showNoSignatureWarning = confirmNoSignature && missingSignature;
    const checkOutLabel = checkingOut
        ? "Checking out..."
        : showNoSignatureWarning ? "Check Out Anyway" : "Check Out";
    const missingEvidence = EVIDENCE_LABELS.filter(({ field }) => visit[field] === null);

    return (
        <section className={styles.caregiverVisit}>
            <Link to={isAdmin ? `/visits/${visit.id}` : "/my-visits"} className={styles.backLink}>
                {isAdmin ? "← Back to visit detail" : "← Back to my visits"}
            </Link>

            <p className={styles.roleBanner}>Caregiver check-in</p>

            <div className={styles.headerRow}>
                <h3 className={styles.title}>{visit.patientName}</h3>
                <StatusPill status={visit.status} />
            </div>

            <dl className={styles.meta}>
                <dt>Appointment</dt>
                <dd>{formatDateTime(visit.appointmentTime)}</dd>

                <dt>Service</dt>
                <dd>{visit.serviceType}</dd>

                {/* Where Marcus is actually going. The app knew this all along
                    and showed it only to the office, on a page he cannot reach. */}
                {patient?.address && (
                    <>
                        <dt>Address</dt>
                        <dd>{patient.address}</dd>
                    </>
                )}
            </dl>

            {/* What this patient needs help with in general, as opposed to what
                they raise during one visit. Standing context belongs before the
                work, not only in a record Denise can see. */}
            {patient?.standingConcerns && (
                <p className={styles.standingConcerns}>
                    <strong>Needs help with:</strong> {patient.standingConcerns}
                </p>
            )}

            {visit.status === VISIT_STATUS.SCHEDULED && (
                <>
                    <button onClick={handleCheckIn} className={styles.checkInButton} disabled={checkingIn}>
                        {checkingIn ? "Checking in..." : "Check In"}
                    </button>
                    <p className={styles.helpNote}>Your device location is recorded if you allow it. Check-in works either way.</p>
                </>
            )}
            {error && <p className={styles.errorNote}>{error}</p> }

            {visit.status === VISIT_STATUS.IN_PROGRESS && (
                <div className={styles.checkedInCard}>
                    <p className={styles.checkedInTime}>Checked in at {formatTime(visit.checkInTime)}</p>
                    <p className={styles.locationNote}>Location: {formatLocation(visit.checkInLocation)}</p>

                    <form className={styles.checkOutForm} onSubmit={handleCheckOut}>
                        <label className={styles.fieldLabel} htmlFor="assessment">Visit assessment</label>
                        <textarea
                            id="assessment"
                            className={styles.fieldInput}
                            rows={4}
                            placeholder="Care provided during this visit..."
                            value={assessment}
                            onChange={(e) => setAssessment(e.target.value)}
                        />

                        <SignatureField
                            id="signature"
                            label="Patient signature (typed)"
                            value={signature}
                            onChange={setSignature}
                            placeholder="Patient types their full name"
                        />

                        {/* warning state for signature*/
                            showNoSignatureWarning && (
                                <p className={styles.warningNote}>
                                    No patient signature. This visit will be flagged for review at check-out.
                                </p>
                            )
                        }

                        <button type="submit" className={styles.checkOutButton} disabled={checkingOut}>
                            {checkOutLabel}
                        </button>
                    </form>
                </div>
            )}

            {visit.status === VISIT_STATUS.NEEDS_REVIEW && (
                <div className={styles.supplyCard}>
                    <h4 className={styles.supplyTitle}>Missing evidence</h4>
                    <ul className={styles.missingList}>
                        {missingEvidence.map(({ field, label }) => (
                            <li key={field}>{label}</li>
                        ))}
                    </ul>

                    {visit.checkOutTime === null && (
                        <p className={styles.warningNote}>
                            Check-out time can't be added after a visit. This needs office follow-up.
                        </p>
                    )}

                    <form className={styles.checkOutForm} onSubmit={handleSupplyEvidence}>
                        {visit.assessment === null && (
                            <>
                                <label className={styles.fieldLabel} htmlFor="assessment">Visit assessment</label>
                                <textarea
                                    id="assessment"
                                    className={styles.fieldInput}
                                    rows={4}
                                    placeholder="Care provided during this visit..."
                                    value={assessment}
                                    onChange={(e) => setAssessment(e.target.value)}
                                />
                            </>
                        )}

                        {visit.signature === null && (
                            <>
                                <SignatureField
                                    id="signature"
                                    label="Patient signature (typed)"
                                    value={signature}
                                    onChange={setSignature}
                                    placeholder="Patient types their full name"
                                />
                            </>
                        )}

                        {/* pending flag + disabled */}
                        <button type="submit" className={styles.checkOutButton} disabled={checkingOut}>
                            { checkingOut ? "Submitting..." : "Submit Evidence" }
                        </button>
                    </form>
                </div>
            )}

            {![VISIT_STATUS.SCHEDULED, VISIT_STATUS.IN_PROGRESS, VISIT_STATUS.NEEDS_REVIEW].includes(visit.status) && (
                <p className={styles.closedNote}>
                    This visit is {visit.status}. No caregiver actions available.
                </p>
            )}
        </section>
    );
};

export default CaregiverVisit;
