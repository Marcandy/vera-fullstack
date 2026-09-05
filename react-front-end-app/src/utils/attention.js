import { VISIT_STATUS } from "./status";

// POLICY, not evidence. How long after an appointment a missing check-in
// starts looking late, and how long a visit can run before a missing
// check-out looks forgotten rather than ongoing. These are the agency's
// rules about what deserves a nudge, not facts about any visit, which is
// why they sit here as named constants instead of being buried in a
// comparison. A real product makes them per service type.
export const LATE_CHECK_IN_GRACE_MINUTES = 15;
export const EXPECTED_VISIT_MINUTES = 120;

// These are NOT visit statuses and must never be compared to one. A status
// is the visit's position in the pipeline, named for the event that put it
// there. Nothing happened here: an attention flag is an observation about
// an event that has NOT happened yet, and folding it into the status
// vocabulary is how "complete" got itself fired.
export const ATTENTION = {
    LATE_CHECK_IN: "late check-in",
    MISSING_CHECK_OUT: "missing check-out",
};

const MINUTE = 60000;

// `now` is a parameter and never read from the clock inside here. A function
// that calls Date.now() itself cannot be tested without faking global time,
// and it hides the fact that its answer changes underneath the caller.
// Passing the instant in makes this pure: same visit, same now, same answer.
export const attentionFor = (visit, now) => {
    if (visit.status === VISIT_STATUS.SCHEDULED) {
        const due = new Date(visit.appointmentTime).getTime() + LATE_CHECK_IN_GRACE_MINUTES * MINUTE;
        return now > due ? ATTENTION.LATE_CHECK_IN : null;
    }

    // Guarded rather than assumed: an in-progress visit always has a check-in
    // time today, but deriving a warning from a missing timestamp would
    // produce a flag out of nothing.
    if (visit.status === VISIT_STATUS.IN_PROGRESS && visit.checkInTime) {
        const due = new Date(visit.checkInTime).getTime() + EXPECTED_VISIT_MINUTES * MINUTE;
        return now > due ? ATTENTION.MISSING_CHECK_OUT : null;
    }

    // Every other status is settled or already flagged by the evidence rule.
    // A needs-review visit does not also need a nudge; it needs evidence.
    return null;
};

// Visits carrying a flag, each paired with it, so callers do not compute the
// same thing twice.
export const visitsNeedingAttention = (visits, now) =>
    visits
        .map((visit) => ({ visit, attention: attentionFor(visit, now) }))
        .filter((entry) => entry.attention !== null);
