import { del, post, request } from "./apiClient";

// GET /api/caregivers
export const getCaregivers = async ({ signal } = {}) =>
    request("/caregivers", { signal });

// GET /api/caregivers/{id}. Returns undefined for an id that does not exist
// rather than throwing, matching getPatientById: a page asking about a record
// that is not there renders a not-found state, it does not catch an error.
export const getCaregiverById = async (caregiverId, { signal } = {}) => {
    try {
        return await request(`/caregivers/${caregiverId}`, { signal });
    } catch (error) {
        if (error.status === 404) return undefined;
        throw error;
    }
};

// POST /api/caregivers. The Java service creates the four blank checklist
// documents. Do not build them in the browser.
export const addCaregiver = async ({ name, phone }) =>
    post("/caregivers", { name, phone });

// DELETE /api/caregivers/{id}. apiClient already accepts an empty 204. A 409
// means they have visits; let it throw so the roster can render err.message.
export const deleteCaregiver = async (id) => del(`/caregivers/${id}`);

// The four verbs below all POST and all resolve to the WHOLE CAREGIVER, because
// every caller does setCaregiver(await verb(...)). Their signatures do not
// change in this port, which is what keeps MyDocuments and CaregiverDetail
// untouched.
//
// Every rule they used to enforce now lives in DocumentService. A rule the
// client enforces is not a rule: the guard that refused to sign a lapsed card
// was one `await` away from being skipped by anything that was not this file.

// POST /api/caregivers/{id}/documents/{documentId}/signature
//
// Keyed by document id, not by name. A name is a label people correct; an id
// is identity, and signing the wrong row because someone fixed a typo is the
// kind of bug that never announces itself.
//
// The status guard and the blank-signature check moved to the server, along
// with the clock: a caller that could choose the instant could choose one where
// an expired document still looks signable. Components still pass their own
// ticking `now` to documentStatus for rendering; the server owns the only clock
// that decides anything.
//
// TODO 1: post to the path above with { signature } as the body.
export const signDocument = async (caregiverId, documentId, signature) => {
    throw new Error("TODO: sign through the API", { cause: { caregiverId, documentId, signature } });
}

// POST /api/caregivers/{id}/documents/{documentId}/submission
//
// The CAREGIVER sending in a renewal themselves. This is how the real products
// work: the aide photographs the new card rather than driving it to the office.
//
// It does NOT take effect. The submission sits beside the live document until
// someone at the agency accepts it, because the agency is what has to produce a
// valid credential at a state survey, and a credential that cleared itself is a
// credential nobody checked. Two consequences worth stating: renewing early
// cannot invalidate a card that is still working, and a lapsed caregiver stays
// lapsed until the office looks, which is the honest answer.
//
// TODO 1: post the five metadata fields. Send them as they arrive; the server
//         does the trimming and the expiry validation now.
// TODO 2: only the metadata leaves the browser. The File object is dropped by
//         the caller, and there is nowhere to put bytes.
export const submitDocumentRenewal = async (
    caregiverId,
    documentId,
    { fileName, fileSize, fileType, issuedAt, expiresAt }
) => {
    throw new Error("TODO: submit a renewal through the API", {
        cause: { caregiverId, documentId, fileName, fileSize, fileType, issuedAt, expiresAt },
    });
}

// POST /api/caregivers/{id}/documents/{documentId}/submission/acceptance
//
// The office accepting what was sent in. Only here does a submitted renewal
// become the credential of record: the pending values are promoted onto the
// document and the submission slot is emptied.
//
// There is deliberately no "accept" that invents evidence. Accepting a
// submission that does not exist is a 409, for the same reason no button
// resolves a visit missing its signature.
//
// TODO 1: post with no body. Accepting carries no new information.
export const acceptDocumentSubmission = async (caregiverId, documentId) => {
    throw new Error("TODO: accept a submission through the API", { cause: { caregiverId, documentId } });
}

// POST /api/caregivers/{id}/documents/{documentId}/file
//
// Records that a file arrived. It does NOT store the file: there is no place to
// hold bytes, so this keeps the metadata a real upload would persist beside the
// blob and the UI says plainly that the document itself is not kept. Inventing
// storage would be the one dishonest thing in the app.
//
// Unlike signing, this accepts a document in any state, because it is how a
// credential is renewed as well as how one first arrives. That is the whole
// exit from EXPIRED, and it works the way the evidence rule works: the hold
// clears when the missing thing is supplied, never because someone dismissed
// it.
//
// TODO 1: same shape as submitDocumentRenewal, different path. The difference
//         that matters is on the server: this one supersedes anything pending.
export const uploadDocument = async (
    caregiverId,
    documentId,
    { fileName, fileSize, fileType, issuedAt, expiresAt }
) => {
    throw new Error("TODO: record a document through the API", {
        cause: { caregiverId, documentId, fileName, fileSize, fileType, issuedAt, expiresAt },
    });
}
