// The status vocabulary in one place. These strings were literals in six
// files and cost three typo bugs, each of which compiled cleanly and failed
// silently: a mistyped status matches no branch and no pill, so the visit
// just quietly stops behaving. A constant turns that into a reference error
// at the point of the mistake.
//
// When this becomes a Spring Boot backend these are an enum on the entity,
// and this file is the thing that maps onto it.
export const VISIT_STATUS = {
    SCHEDULED: "scheduled",
    IN_PROGRESS: "in progress",
    NEEDS_REVIEW: "needs review",
    READY_TO_BILL: "ready to bill",
    BILLED: "billed",
};

// Onboarding documents run their own vocabulary. They share StatusPill, so
// they belong in the same module, but they are NOT visit statuses and the
// two must never be compared to each other.
export const DOCUMENT_STATUS = {
    SIGNED: "signed",
    PENDING: "pending",
    EXPIRING: "expiring",
    EXPIRED: "expired",
};

// EXPIRED is what a stored status could never say. While the seed asserted
// "expiring", a document that had actually lapsed still read as merely
// expiring forever, because nothing re-evaluated it. Deriving the status from
// expiresAt made the lapsed case fall out on its own, and it is the one that
// has to block clearance: see src/utils/documents.js.

// PIPELINE order: the sequence a visit actually moves through. Deliberately
// not attention order, which is a screen's opinion about what Denise should
// look at first and lives with that screen. Two different orderings of the
// same vocabulary, kept apart on purpose.
export const VISIT_STATUS_LIST = [
    VISIT_STATUS.SCHEDULED,
    VISIT_STATUS.IN_PROGRESS,
    VISIT_STATUS.NEEDS_REVIEW,
    VISIT_STATUS.READY_TO_BILL,
    VISIT_STATUS.BILLED,
];

// The URL is untrusted: anyone can type ?status=bogus. Falls back to null,
// meaning unfiltered, rather than showing a blank list with no explanation.
export const parseVisitStatus = (value) =>
    VISIT_STATUS_LIST.includes(value) ? value : null;
