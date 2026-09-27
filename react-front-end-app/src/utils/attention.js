import { VISIT_STATUS } from "./status";

// Agency policy, not facts about a visit.
export const LATE_CHECK_IN_GRACE_MINUTES = 15;
export const EXPECTED_VISIT_MINUTES = 120;

// Not visit statuses: a flag observes an event that has not happened yet.
export const ATTENTION = {
    LATE_CHECK_IN: "late check-in",
    MISSING_CHECK_OUT: "missing check-out",
};

const MINUTE = 60000;

// `now` is a parameter so the answer is pure and testable at a fixed instant.
export const attentionFor = (visit, now) => {
    if (visit.status === VISIT_STATUS.SCHEDULED) {
        const due = new Date(visit.appointmentTime).getTime() + LATE_CHECK_IN_GRACE_MINUTES * MINUTE;
        return now > due ? ATTENTION.LATE_CHECK_IN : null;
    }

    if (visit.status === VISIT_STATUS.IN_PROGRESS && visit.checkInTime) {
        const due = new Date(visit.checkInTime).getTime() + EXPECTED_VISIT_MINUTES * MINUTE;
        return now > due ? ATTENTION.MISSING_CHECK_OUT : null;
    }

    // A needs-review visit needs evidence, not a nudge.
    return null;
};

export const visitsNeedingAttention = (visits, now) =>
    visits
        .map((visit) => ({ visit, attention: attentionFor(visit, now) }))
        .filter((entry) => entry.attention !== null);
