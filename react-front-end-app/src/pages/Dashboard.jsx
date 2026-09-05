import { Link } from "react-router";
import { getVisits } from "../services/visitService";
import { getCaregivers } from "../services/caregiverService";
import { VISIT_STATUS } from "../utils/status";
import { countByStatus, sumCost } from "../utils/visits";
import { formatCurrency, formatDateTime } from "../utils/format";
import { visitsNeedingAttention } from "../utils/attention";
import { credentialsNeedingAttention, isClearedToWork, daysUntil, submissionsAwaitingReview } from "../utils/documents";
import { DOCUMENT_STATUS } from "../utils/status";
import { useNow } from "../hooks/useNow";
import { useAsyncData } from "../hooks/useAsyncData";
import AttentionFlag from "../components/AttentionFlag";
import StatusPill from "../components/StatusPill";
import LoadError from "../components/LoadError";
import styles from "./Dashboard.module.css";

// Denise's stated need is knowing what wants her within five seconds of
// landing. A list of ten visits does not answer that; it makes her read.
// These two tiles are the only ones she can act on, which is why they sit
// apart from the rest and why the pipeline counts below them are quieter.
const ACTIONABLE = [
    {
        status: VISIT_STATUS.NEEDS_REVIEW,
        title: "Need review",
        blurb: "Missing evidence is holding these out of billing",
    },
    {
        status: VISIT_STATUS.READY_TO_BILL,
        title: "Ready to bill",
        blurb: "Verified and waiting on a claim",
    },
];

// Reads the day count as a person would, and says which side of the date it
// falls on. "Lapsed 12 days ago" and "expires in 18 days" are different
// instructions, not two shades of the same warning.
const expiryPhrase = (days) => {
    const count = Math.abs(days);
    const unit = count === 1 ? "day" : "days";

    return days >= 0 ? `expires in ${count} ${unit}` : `lapsed ${count} ${unit} ago`;
};

const PIPELINE = [
    { status: VISIT_STATUS.IN_PROGRESS, title: "In progress" },
    { status: VISIT_STATUS.SCHEDULED, title: "Scheduled" },
    { status: VISIT_STATUS.BILLED, title: "Billed" },
];

const Dashboard = () => {
    // Two independent facts, fetched together rather than in sequence.
    // Promise.all fails the pair if either fails, which keeps one error state
    // for one screen; the cost is that a failed caregiver read takes the visit
    // panels down with it.
    const { data, error: loadError, loading, reload } = useAsyncData(
        (signal) => Promise.all([getVisits({}, { signal }), getCaregivers({ signal })]), []);

    // The counts below answer what is in the pipeline. This answers what is
    // going wrong right now, which the pipeline cannot see: a visit sitting
    // scheduled past its appointment still counts as scheduled.
    const now = useNow();

    if (loadError) return (
        <LoadError
            message={`The dashboard could not load. ${loadError.message}`}
            onRetry={reload}
        />
    );

    if (loading) return <p>Loading...</p>

    const [visitList, caregiverList] = data;

    // Derived at render from the records themselves, so a count can never
    // disagree with the list it summarizes.
    const counts = countByStatus(visitList);
    const needsAttention = visitsNeedingAttention(visitList, now);

    // The other half of what Denise is accountable for. Visits prove care
    // happened; credentials prove the person delivering it was allowed to.
    // The dashboard knew about the first and said nothing about the second.
    const credentials = credentialsNeedingAttention(caregiverList, now);
    const notCleared = caregiverList.filter((caregiver) => !isClearedToWork(caregiver, now));

    // Work already done that only Denise can finish. Without this the loop is
    // open: a caregiver sends a renewal in and nothing ever tells the office to
    // look at it, so the document sits pending forever and the caregiver
    // believes they are covered.
    const awaitingReview = submissionsAwaitingReview(caregiverList);
    const readyToBillTotal = sumCost(
        visitList.filter((visit) => visit.status === VISIT_STATUS.READY_TO_BILL)
    );

    if (visitList.length === 0) {
        return (
            <section className={styles.dashboard}>
                <h3>Dashboard</h3>
                <p className={styles.emptyState}>
                    No visits yet. Once visits are scheduled, this is where
                    what needs your attention will show up.
                </p>
            </section>
        );
    }

    return (
        <section className={styles.dashboard}>
            <h3>Dashboard</h3>

            <div className={styles.actionRow}>
                {ACTIONABLE.map(({ status, title, blurb }) => (
                    <Link
                        key={status}
                        to={`/visits?status=${encodeURIComponent(status)}`}
                        className={styles.actionTile}
                    >
                        <span className={styles.tileCount}>{counts[status] ?? 0}</span>
                        <span className={styles.tileTitle}>{title}</span>
                        <span className={styles.tileBlurb}>{blurb}</span>
                    </Link>
                ))}

                <Link to="/billing" className={styles.moneyTile}>
                    <span className={styles.tileCount}>{formatCurrency(readyToBillTotal)}</span>
                    <span className={styles.tileTitle}>Ready to claim</span>
                    <span className={styles.tileBlurb}>Verified care not yet submitted</span>
                </Link>
            </div>

            {needsAttention.length > 0 && (
                <div className={styles.nudgePanel}>
                    <h4 className={styles.nudgeTitle}>Needs a nudge</h4>
                    <ul className={styles.nudgeList}>
                        {needsAttention.map(({ visit, attention }) => (
                            <li key={visit.id} className={styles.nudgeRow}>
                                <Link to={`/visits/${visit.id}`} className={styles.nudgeLink}>
                                    {visit.patientName}
                                </Link>
                                <span className={styles.nudgeMeta}>
                                    {visit.caregiverName} · {formatDateTime(visit.appointmentTime)}
                                </span>
                                <AttentionFlag attention={attention} />
                            </li>
                        ))}
                    </ul>
                    <p className={styles.nudgeNote}>
                        Derived from the clock, not stored. A punch the office
                        enters later is a manual edit, so the cheapest fix is the
                        caregiver making it.
                    </p>
                </div>
            )}

            {(credentials.length > 0 || notCleared.length > 0 || awaitingReview.length > 0) && (
                <div className={styles.credentialPanel}>
                    <h4 className={styles.nudgeTitle}>Credentials to chase</h4>

                    {credentials.length > 0 && (
                        <ul className={styles.nudgeList}>
                            {credentials.map(({ caregiver, document, status }) => (
                                // Keyed by the document id, which is unique across
                                // the whole roster, so no composite key is needed.
                                <li key={document.id} className={styles.nudgeRow}>
                                    <Link to={`/caregivers/${caregiver.id}`} className={styles.nudgeLink}>
                                        {caregiver.name}
                                    </Link>
                                    <span className={styles.nudgeMeta}>
                                        {document.name} · {expiryPhrase(daysUntil(document.expiresAt, now))}
                                    </span>
                                    <StatusPill status={status} />
                                </li>
                            ))}
                        </ul>
                    )}

                    {awaitingReview.length > 0 && (
                        <ul className={styles.nudgeList}>
                            {awaitingReview.map(({ caregiver, document }) => (
                                <li key={document.id} className={styles.nudgeRow}>
                                    <Link to={`/caregivers/${caregiver.id}`} className={styles.nudgeLink}>
                                        {caregiver.name}
                                    </Link>
                                    <span className={styles.nudgeMeta}>
                                        {document.name} · sent in, waiting on you
                                    </span>
                                    <span className={styles.reviewFlag}>needs your check</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {notCleared.length > 0 && (
                        <p className={styles.clearanceLine}>
                            <Link to="/caregivers">
                                {notCleared.length} of {caregiverList.length} caregivers
                            </Link>
                            {notCleared.length === 1 ? " is" : " are"} not cleared to work.
                            {credentials.some((entry) => entry.status === DOCUMENT_STATUS.EXPIRED)
                                ? " A lapsed credential is cleared by recording a current one, never by signing it off."
                                : " Outstanding paperwork is what is holding them."}
                        </p>
                    )}
                </div>
            )}

            <h4 className={styles.sectionTitle}>Everything else</h4>
            <div className={styles.pipelineRow}>
                {PIPELINE.map(({ status, title }) => (
                    <Link
                        key={status}
                        to={`/visits?status=${encodeURIComponent(status)}`}
                        className={styles.pipelineTile}
                    >
                        <span className={styles.pipelineCount}>{counts[status] ?? 0}</span>
                        <span className={styles.pipelineTitle}>{title}</span>
                    </Link>
                ))}
            </div>

            <p className={styles.allLink}>
                <Link to="/visits">See all {visitList.length} visits</Link>
            </p>
        </section>
    );
}

export default Dashboard;
