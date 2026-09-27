import { del, post, request } from "./apiClient";

export const getCaregivers = async ({ signal } = {}) =>
    request("/caregivers", { signal });

// Undefined, not a throw: the page renders not found.
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

// The document verbs resolve to the whole caregiver; DocumentService owns the rules.

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

// A 409 means nothing was waiting.
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
