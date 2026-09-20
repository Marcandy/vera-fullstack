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

// The four verbs below all resolve to the WHOLE CAREGIVER, because every caller
// does setCaregiver(await verb(...)). Their signatures did not change in the
// port, which is what kept MyDocuments and CaregiverDetail untouched.
//
// Every rule they used to enforce now lives in DocumentService. A rule the
// client enforces is not a rule: the guard that refused to sign a lapsed card
// was one `await` away from being skipped by anything that was not this file.
// Only the metadata of a file ever leaves the browser, because there is nowhere
// to put the bytes.

// Keyed by document id, not by name. A name is a label people correct; an id is
// identity, and signing the wrong row because someone fixed a typo is the kind
// of bug that never announces itself.
export const signDocument = async (caregiverId, documentId, signature) =>
    post(`/caregivers/${caregiverId}/documents/${documentId}/signature`, { signature });

// The CAREGIVER sending in a renewal themselves. It does not take effect: the
// submission waits beside the live document until the office accepts it,
// because a credential that cleared itself is one nobody checked.
export const submitDocumentRenewal = async (
    caregiverId,
    documentId,
    { fileName, fileSize, fileType, issuedAt, expiresAt }
) =>
    post(`/caregivers/${caregiverId}/documents/${documentId}/submission`, {
        fileName,
        fileSize,
        fileType,
        issuedAt,
        expiresAt,
    });

// The office accepting what was sent in, and the only step that makes a
// submitted renewal the credential of record. No body: accepting carries no new
// information. A 409 means nothing was waiting.
export const acceptDocumentSubmission = async (caregiverId, documentId) =>
    post(`/caregivers/${caregiverId}/documents/${documentId}/submission/acceptance`);

// The office recording a document directly. Unlike signing this is accepted in
// any state, because it is how a credential arrives and how a lapsed one is
// replaced, and it supersedes anything the caregiver had pending.
export const uploadDocument = async (
    caregiverId,
    documentId,
    { fileName, fileSize, fileType, issuedAt, expiresAt }
) =>
    post(`/caregivers/${caregiverId}/documents/${documentId}/file`, {
        fileName,
        fileSize,
        fileType,
        issuedAt,
        expiresAt,
    });
