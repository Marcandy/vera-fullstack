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

// Chronological, not by attention rank. The dashboard orders by what needs
// Denise to act; a caregiver works through a day in the order it happens.
const byAppointment = (a, b) => a.appointmentTime.localeCompare(b.appointmentTime);

// History reads backwards from now, which is the opposite of a day.
const byMostRecent = (a, b) => b.appointmentTime.localeCompare(a.appointmentTime);

const MyVisits = () => {
    const { user, loading } = useSession();


    // The caregiver gets the same derivation as the office. Telling Denise a
    // punch was missed only reports the problem; telling Marcus while he can
    // still fix it is the point.
    const now = useNow();

    // The caregiver id comes from the session, never from the URL. A route
    // like /my-visits?caregiverId=3 would let anyone read a colleague's
    // patients by typing, and the server-side version of that mistake is a
    // controller trusting a client-supplied actor instead of the principal.
    const caregiverId = user?.caregiverId ?? null;

    // Skipped rather than guarded inside the effect: an admin has no caregiver
    // record, and asking for "the visits of nobody" is not a request worth
    // sending. The hook stays in loading until there is something to ask.
    const { data: visitList, error: loadError, loading: visitsLoading, reload } = useAsyncData(
        (signal) => getVisitsByCaregiver(caregiverId, { signal }),
        [caregiverId],
        { skip: caregiverId === null });

    // While the session is still unknown, user is null but nobody is signed
    // out yet. Answering here would flash "nobody is signed in" at a
    // caregiver who is, on every refresh. This is what the third state is for.
    if (loading) return <p>Loading...</p>

    // Two different reasons for an empty screen, and they need different
    // answers. Nobody signed in is not the same as signed in without a
    // caregiver record, and telling a visitor that "your account" lacks
    // something claims an account they do not have.
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

    // An admin has no caregiver record, so an empty visit list would be a
    // misleading answer to a question they cannot ask.
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

    // THREE QUESTIONS, NOT ONE LIST. This screen used to answer "every visit
    // ever assigned to you, oldest first", which put three already-billed visits
    // from last month above the one job happening today. A caregiver opens this
    // on a phone between houses; the answer has to be what to do next.
    // Needs-review visits are excluded here even when they happened today, so a
    // visit checked out this afternoon without a signature appears once, under
    // the heading that says what to do about it, rather than twice.
    const today = visitList
        .filter((visit) => visit.status !== VISIT_STATUS.NEEDS_REVIEW
            && isSameLocalDay(visit.appointmentTime, now))
        .sort(byAppointment);

    // Visits held for missing evidence, whatever day they happened. These are
    // here because the caregiver is the ONLY person who can clear them: the
    // office can chase a missing signature but cannot produce one.
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
