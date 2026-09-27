import { DOCUMENT_STATUS } from "./status";

// Agency policy. Must match RENEWAL_WINDOW_DAYS in DocumentService.java.
export const RENEWAL_WINDOW_DAYS = 30;

const DAY = 86400000;

// `now` is a parameter, like attentionFor, so the answer is testable at a fixed instant.
export const documentStatus = (document, now) => {
    // Until the office has a signature or a file, there is nothing to expire.
    const received = Boolean(document.signature || document.fileName);
    if (!received) return DOCUMENT_STATUS.PENDING;

    // A document with no expiry, like a background check, never lapses.
    if (!document.expiresAt) return DOCUMENT_STATUS.SIGNED;

    const expires = new Date(document.expiresAt).getTime();

    if (expires <= now) return DOCUMENT_STATUS.EXPIRED;
    if (expires <= now + RENEWAL_WINDOW_DAYS * DAY) return DOCUMENT_STATUS.EXPIRING;

    return DOCUMENT_STATUS.SIGNED;
};

// EXPIRING does not block: a card lapsing in three weeks is valid today.
const BLOCKS_CLEARANCE = [DOCUMENT_STATUS.PENDING, DOCUMENT_STATUS.EXPIRED];

export const isClearedToWork = (caregiver, now) =>
    !caregiver.documents.some((document) =>
        BLOCKS_CLEARANCE.includes(documentStatus(document, now))
    );

export const documentSummary = (caregiver, now) => {
    const summary = {
        total: caregiver.documents.length,
        [DOCUMENT_STATUS.SIGNED]: 0,
        [DOCUMENT_STATUS.PENDING]: 0,
        [DOCUMENT_STATUS.EXPIRING]: 0,
        [DOCUMENT_STATUS.EXPIRED]: 0,
    };

    for (const document of caregiver.documents) {
        summary[documentStatus(document, now)] += 1;
    }

    return summary;
};

// Time running out, not paperwork never arriving; the roster already shows pending.
const CREDENTIAL_ATTENTION = [DOCUMENT_STATUS.EXPIRED, DOCUMENT_STATUS.EXPIRING];

// Oldest expiry first, so expired sorts ahead of expiring without a rank table.
const byExpiry = (a, b) => a.document.expiresAt.localeCompare(b.document.expiresAt);

// Only dated documents can reach either status, so byExpiry needs no guard.
export const credentialsNeedingAttention = (caregivers, now) =>
    caregivers
        .flatMap((caregiver) =>
            caregiver.documents
                .map((document) => ({ caregiver, document, status: documentStatus(document, now) }))
                .filter((entry) => CREDENTIAL_ATTENTION.includes(entry.status))
        )
        .sort(byExpiry);

// Not a document status: the credential in force keeps its status until the
// office accepts the renewal.
export const hasPendingSubmission = (document) => Boolean(document.submission);

// Renewals waiting on the office to accept them.
export const submissionsAwaitingReview = (caregivers) =>
    caregivers
        .flatMap((caregiver) =>
            caregiver.documents
                .filter(hasPendingSubmission)
                .map((document) => ({ caregiver, document }))
        )
        .sort((a, b) => a.document.submission.submittedAt.localeCompare(b.document.submission.submittedAt));

// Rounded away from zero. The sign comes from the raw difference, because Math.ceil
// of a small negative is -0, and -0 >= 0 is true.
export const daysUntil = (isoString, now) => {
    const difference = new Date(isoString).getTime() - now;

    return difference >= 0
        ? Math.ceil(difference / DAY)
        : -Math.ceil(-difference / DAY);
};
