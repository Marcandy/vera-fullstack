import { Link } from "react-router";
import VisitCard from "../components/VisitCard";
import { getVisitsByCaregiver } from "../services/visitService";
import { useSession } from "../context/sessionContext";
import { useNow } from "../hooks/useNow";
import { useAsyncData } from "../hooks/useAsyncData";
import { attentionFor, visitsNeedingAttention } from "../utils/attention";
import { isSameLocalDay } from "../utils/visits";
import { VISIT_STATUS } from "../utils/status";
import LoadError from "../components/LoadError";
import styles from "./MyVisits.module.css";

// Chronological: a caregiver works through the day in order.
const byAppointment = (a, b) => a.appointmentTime.localeCompare(b.appointmentTime);

const byMostRecent = (a, b) => b.appointmentTime.localeCompare(a.appointmentTime);

const MyVisits = () => {
    const { user, loading } = useSession();


    const now = useNow();

    // From the session, never the URL, or anyone could read a colleague's patients.
    const caregiverId = user?.caregiverId ?? null;

    // Skipped for an admin, who has no caregiver record.
    const { data: visitList, error: loadError, loading: visitsLoading, reload } = useAsyncData(
        (signal) => getVisitsByCaregiver(caregiverId, { signal }),
        [caregiverId],
        { skip: caregiverId === null });

    // Session still unknown: answering now would flash "nobody is signed in".
    if (loading) return <p>Loading...</p>

    if (!user) {
        return (
            <section className={styles.myVisits}>
                <h3>My visits</h3>
                <p className={styles.emptyState}>
                    Nobody is signed in, so there is no schedule to show.
                    <br />
                    <Link to="/">Sign in</Link> to see your visits.
                </p>
            </section>
        );
    }

    if (caregiverId === null) {
        return (
            <section className={styles.myVisits}>
                <h3>My visits</h3>
                <p className={styles.emptyState}>
                    This view belongs to a caregiver, and your account is not
                    linked to a caregiver record. The{" "}
                    <Link to="/visits">visit list</Link> has every visit in
                    the agency.
                </p>
            </section>
        );
    }

    if (loadError) return (
        <LoadError
            message={`Your visits could not load. ${loadError.message}`}
            onRetry={reload}
        />
    );

    if (visitsLoading) return <p>Loading...</p>

    const needsAttention = visitsNeedingAttention(visitList, now);

    // Three questions, not one list: what to do next comes first. Needs-review visits
    // appear once, under the heading that says what to do about them.
    const today = visitList
        .filter((visit) => visit.status !== VISIT_STATUS.NEEDS_REVIEW
            && isSameLocalDay(visit.appointmentTime, now))
        .sort(byAppointment);

    // Only the caregiver can clear these: the office cannot produce a signature.
    const needsEvidence = visitList
        .filter((visit) => visit.status === VISIT_STATUS.NEEDS_REVIEW)
        .sort(byMostRecent);

    const shown = new Set([...today, ...needsEvidence].map((visit) => visit.id));
    const earlier = visitList
        .filter((visit) => !shown.has(visit.id))
        .sort(byMostRecent);

    const renderVisit = (visit) => (
        <li key={visit.id}>
            <Link to={`/caregiver/visits/${visit.id}`} className={styles.cardLink}>
                <VisitCard
                    visit={visit}
                    attention={attentionFor(visit, now)}
                    showCaregiver={false}
                />
            </Link>
        </li>
    );

    return (
        <section className={styles.myVisits}>
            <h3>My visits</h3>
            <p className={styles.subtitle}>Signed in as {user.name}</p>

            {needsAttention.length > 0 && (
                <p className={styles.nudge}>
                    <strong>{needsAttention.length === 1 ? "One visit needs" : `${needsAttention.length} visits need`} a punch.</strong>{" "}
                    Fixing it yourself keeps the record clean. A time entered by
                    the office later counts as a manual edit.
                </p>
            )}

            {visitList.length === 0 ? (
                <p className={styles.emptyState}>
                    No visits are assigned to you yet. Scheduled visits will
                    appear here.
                </p>
            ) : (
                <>
                    <h4 className={styles.sectionTitle}>
                        Today{today.length > 0 && ` (${today.length})`}
                    </h4>
                    {today.length === 0 ? (
                        <p className={styles.emptyState}>
                            Nothing scheduled today.
                        </p>
                    ) : (
                        <ul className={styles.visitList}>{today.map(renderVisit)}</ul>
                    )}

                    {needsEvidence.length > 0 && (
                        <>
                            <h4 className={styles.sectionTitle}>
                                Waiting on you ({needsEvidence.length})
                            </h4>
                            <p className={styles.sectionNote}>
                                Held out of billing until the missing evidence is
                                supplied. Nobody else can supply it.
                            </p>
                            <ul className={styles.visitList}>{needsEvidence.map(renderVisit)}</ul>
                        </>
                    )}

                    {earlier.length > 0 && (
                        <>
                            <h4 className={styles.sectionTitle}>
                                Earlier ({earlier.length})
                            </h4>
                            <ul className={styles.visitList}>{earlier.map(renderVisit)}</ul>
                        </>
                    )}
                </>
            )}
        </section>
    );
};

export default MyVisits;
