// The status vocabulary in one place. These strings were literals in six
// files and cost three typo bugs, each of which compiled cleanly and failed
// silently: a mistyped status matches no branch and no pill, so the visit
// just quietly stops behaving. A constant turns that into a reference error
// at the point of the mistake.
//
// When this becomes a Spring Boot backend these are an enum on the entity,
// and this file is the thing that maps onto it.

// The VALUE is an identifier, not a label. It used to be "in progress", which
// read well on screen and made the string do two jobs: name the state, and be
// the words shown to a person. Those change for different reasons. The identifier
// now matches the Java enum constant exactly, so one vocabulary runs from the
// MySQL column through the JSON body and the URL to this file, with no
// translation layer anywhere. The words a person reads live in the LABEL map
// below, which is the only place wording is decided.
export const VISIT_STATUS = {
    SCHEDULED: "SCHEDULED",
    IN_PROGRESS: "IN_PROGRESS",
    NEEDS_REVIEW: "NEEDS_REVIEW",
    READY_TO_BILL: "READY_TO_BILL",
    BILLED: "BILLED",
};

// What a person reads. Separate from the identifier on purpose: renaming a pill
// is a copy change, not a data change, and it must never require a migration.
export const VISIT_STATUS_LABEL = {
    [VISIT_STATUS.SCHEDULED]: "Scheduled",
    [VISIT_STATUS.IN_PROGRESS]: "In progress",
    [VISIT_STATUS.NEEDS_REVIEW]: "Needs review",
    [VISIT_STATUS.READY_TO_BILL]: "Ready to bill",
    [VISIT_STATUS.BILLED]: "Billed",
};

// Onboarding documents run their own vocabulary. They share StatusPill, so
// they belong in the same module, but they are NOT visit statuses and the
// two must never be compared to each other.
export const DOCUMENT_STATUS = {
    SIGNED: "SIGNED",
    PENDING: "PENDING",
    EXPIRING: "EXPIRING",
    EXPIRED: "EXPIRED",
};

// Same split, same reason. This one is never a column, because document status
// is derived from the dates and the clock, but it still crosses the wire as a
// computed field and it shares StatusPill, so one convention beats two.
export const DOCUMENT_STATUS_LABEL = {
    [DOCUMENT_STATUS.SIGNED]: "Signed",
    [DOCUMENT_STATUS.PENDING]: "Pending",
    [DOCUMENT_STATUS.EXPIRING]: "Expiring",
    [DOCUMENT_STATUS.EXPIRED]: "Expired",
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
