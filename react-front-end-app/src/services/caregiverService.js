import { del, post, request } from "./apiClient";

// GET /api/caregivers
export const getCaregivers = async ({ signal } = {}) =>
    request("/caregivers", { signal });

// Returns undefined for an id that does not exist rather than throwing,
// matching getPatientById: a page asking about a record that is not there
// renders a not-found state, it does not catch an error.
export const getCaregiverById = async (caregiverId, { signal } = {}) => {
    try {
        return await request(`/caregivers/${caregiverId}`, { signal });
    } catch (error) {
        if (error.status === 404) return undefined;
        throw error;
    }
};

// The Java service creates the four blank checklist documents.
export const addCaregiver = async ({ name, phone }) =>
    post("/caregivers", { name, phone });

// A 409 means they have visits; let it throw so the roster renders err.message.
export const deleteCaregiver = async (id) => del(`/caregivers/${id}`);

// The four document verbs below all resolve to the WHOLE CAREGIVER, because
// every caller does setCaregiver(await verb(...)). Every rule they used to
// enforce now lives in DocumentService: a rule the client enforces is not a
// rule. Only file metadata ever leaves the browser.

export const signDocument = async (caregiverId, documentId, signature) =>
    post(`/caregivers/${caregiverId}/documents/${documentId}/signature`, { signature });

// Waits beside the live document until the office accepts it.
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

// No body: accepting carries no new information. A 409 means nothing waited.
export const acceptDocumentSubmission = async (caregiverId, documentId) =>
    post(`/caregivers/${caregiverId}/documents/${documentId}/submission/acceptance`);

// The office recording one directly, which supersedes anything pending.
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
