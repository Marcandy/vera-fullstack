// Values match the Java enum constants exactly; wording lives in the LABEL maps.
export const VISIT_STATUS = {
    SCHEDULED: "SCHEDULED",
    IN_PROGRESS: "IN_PROGRESS",
    NEEDS_REVIEW: "NEEDS_REVIEW",
    READY_TO_BILL: "READY_TO_BILL",
    BILLED: "BILLED",
    CANCELLED: "CANCELLED",
};

export const VISIT_STATUS_LABEL = {
    [VISIT_STATUS.SCHEDULED]: "Scheduled",
    [VISIT_STATUS.IN_PROGRESS]: "In progress",
    [VISIT_STATUS.NEEDS_REVIEW]: "Needs review",
    [VISIT_STATUS.READY_TO_BILL]: "Ready to bill",
    [VISIT_STATUS.BILLED]: "Billed",
    [VISIT_STATUS.CANCELLED]: "Cancelled",
};

// Not visit statuses; never compare the two.
export const DOCUMENT_STATUS = {
    SIGNED: "SIGNED",
    PENDING: "PENDING",
    EXPIRING: "EXPIRING",
    EXPIRED: "EXPIRED",
};

export const DOCUMENT_STATUS_LABEL = {
    [DOCUMENT_STATUS.SIGNED]: "Signed",
    [DOCUMENT_STATUS.PENDING]: "Pending",
    [DOCUMENT_STATUS.EXPIRING]: "Expiring",
    [DOCUMENT_STATUS.EXPIRED]: "Expired",
};

// Pipeline order. CANCELLED is omitted: it is an exit, and parseVisitStatus uses
// this list as the URL allowlist.
export const VISIT_STATUS_LIST = [
    VISIT_STATUS.SCHEDULED,
    VISIT_STATUS.IN_PROGRESS,
    VISIT_STATUS.NEEDS_REVIEW,
    VISIT_STATUS.READY_TO_BILL,
    VISIT_STATUS.BILLED,
];

// The URL is untrusted: anything unknown falls back to null, meaning unfiltered.
export const parseVisitStatus = (value) =>
    VISIT_STATUS_LIST.includes(value) ? value : null;
