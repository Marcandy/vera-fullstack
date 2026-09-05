import { caregivers } from "../data/caregivers";
import { documentStatus } from "../utils/documents";
import { DOCUMENT_STATUS } from "../utils/status";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Both lookups throw rather than return undefined, because every caller here
// is a mutation: a write against a record that is not there is a 404, not an
// empty result to render. The reads below still return undefined, matching
// getVisitById and getPatientById.
const findCaregiverIdx = (caregiverId) => {
    const idx = caregivers.findIndex((caregiver) => caregiver.id === Number(caregiverId));
    if (idx === -1) {
        throw new Error(`Caregiver ${caregiverId} not found`);
    }
    return idx;
}

const findDocument = (caregiver, documentId) => {
    const document = caregiver.documents.find((doc) => doc.id === Number(documentId));
    if (!document) {
        throw new Error(`Document ${documentId} not found`);
    }
    return document;
}

// Replaces one document inside one caregiver, returning new objects the whole
// way up: new document, new documents array, new caregiver. React compares by
// reference, so mutating the document in place would leave every consumer
// holding the same object it already had and rendering the stale value.
const withDocument = (caregiver, documentId, changes) => ({
    ...caregiver,
    documents: caregiver.documents.map((doc) =>
        doc.id === Number(documentId) ? { ...doc, ...changes } : doc
    ),
});

// GET /api/caregivers
export const getCaregivers = async () => {
    await delay(300);

    return caregivers
}

// GET /api/caregivers/{id}. Returns undefined for an id that does not exist
// rather than throwing, matching getPatientById: a page asking about a record
// that is not there renders a not-found state, it does not catch an error.
export const getCaregiverById = async (caregiverId) => {
    await delay(300);

    return caregivers.find((caregiver) => caregiver.id === Number(caregiverId));
}

// POST /api/caregivers
export const addCaregiver = async ({ name, phone }) => {
    await delay(300);
    if(!name?.trim()) throw new Error("Caregiver name is required");

    // Document ids are unique across every caregiver, not within one, because
    // documents are their own table with their own primary key. Taking the max
    // over all of them is what a sequence does.
    const nextDocumentId =
        Math.max(...caregivers.flatMap((c) => c.documents.map((doc) => doc.id))) + 1;

    // A new hire starts with the checklist and nothing received. Every field
    // is null rather than absent: null is a captured absence, an undefined key
    // is a shape that disagrees with every other document.
    const blankDocument = (id, docName) => ({
        id,
        name: docName,
        issuedAt: null,
        expiresAt: null,
        signature: null,
        fileName: null,
        fileSize: null,
        fileType: null,
        receivedAt: null,
        submission: null,
    });

    const newCaregiver = {
        id: Math.max(...caregivers.map((c) => c.id)) + 1,
        name,
        phone,
        documents: [
            "State ID",
            "Background Check",
            "CPR Certification",
            "TB Test",
        ].map((docName, offset) => blankDocument(nextDocumentId + offset, docName)),
    }

    caregivers.push(newCaregiver);
    return newCaregiver;
}

// POST /api/caregivers/{id}/documents/{documentId}/signature
//
// Keyed by document id, not by name. A name is a label people correct; an id
// is identity, and signing the wrong row because someone fixed a typo is the
// kind of bug that never announces itself.
//
// The service reads the clock itself, the same rule check-in follows: the
// status this guard tests is derived from time, and a caller that could pick
// the instant could pick one where an expired document still looks signable.
// Components pass their own ticking `now` to documentStatus for rendering;
// the server passes the only clock that decides anything.
export const signDocument = async (caregiverId, documentId, signature) => {
    await delay(300)

    const idx = findCaregiverIdx(caregiverId);
    const document = findDocument(caregivers[idx], documentId);

    const status = documentStatus(document, Date.now());

    // Only a document nobody has yet is signable. An EXPIRED credential is
    // the interesting refusal: a signature does not renew a lapsed CPR card,
    // and letting an admin sign one away would be the same mistake as a
    // resolve button on a visit missing its evidence. Only a new card clears
    // it, which is what uploadDocument is for.
    if (status !== DOCUMENT_STATUS.PENDING) {
        throw new Error(
            status === DOCUMENT_STATUS.EXPIRED
                ? "This document has expired. Signing does not renew it; record the new one instead."
                : `Cannot sign a document that is ${status}`
        );
    }

    if (!signature?.trim()) {
        throw new Error("Signature is required");
    }

    const updated = withDocument(caregivers[idx], documentId, {
        signature: signature.trim(),
        receivedAt: new Date().toISOString(),
    });

    caregivers[idx] = updated;
    return updated;
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
export const submitDocumentRenewal = async (
    caregiverId,
    documentId,
    { fileName, fileSize, fileType, issuedAt, expiresAt }
) => {
    await delay(500);

    const idx = findCaregiverIdx(caregiverId);
    findDocument(caregivers[idx], documentId);

    if (!fileName?.trim()) {
        throw new Error("Choose a file to send in");
    }

    if (expiresAt) {
        const expires = new Date(expiresAt).getTime();

        if (Number.isNaN(expires)) {
            throw new Error("Expiry date is not a valid date");
        }

        if (expires <= Date.now()) {
            throw new Error("That expiry date has already passed; send in a current document");
        }
    }

    const updated = withDocument(caregivers[idx], documentId, {
        submission: {
            fileName: fileName.trim(),
            fileSize: fileSize ?? null,
            fileType: fileType ?? null,
            issuedAt: issuedAt || null,
            expiresAt: expiresAt || null,
            submittedAt: new Date().toISOString(),
        },
    });

    caregivers[idx] = updated;
    return updated;
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
export const acceptDocumentSubmission = async (caregiverId, documentId) => {
    await delay(300);

    const idx = findCaregiverIdx(caregiverId);
    const document = findDocument(caregivers[idx], documentId);

    if (!document.submission) {
        throw new Error("There is nothing waiting to be accepted on this document");
    }

    const { submittedAt, ...credential } = document.submission;

    const updated = withDocument(caregivers[idx], documentId, {
        ...credential,
        signature: null,
        receivedAt: submittedAt,
        submission: null,
    });

    caregivers[idx] = updated;
    return updated;
}

// POST /api/caregivers/{id}/documents/{documentId}/file
//
// Records that a file arrived. It does NOT store the file: there is no
// backend to hold bytes, so this keeps the metadata a real upload would
// persist beside the blob and the UI says plainly that the document itself
// is not kept. Inventing storage would be the one dishonest thing in the app.
//
// Unlike signing, this accepts a document in any state, because it is how a
// credential is renewed as well as how one first arrives. That is the whole
// exit from EXPIRED, and it works the way the evidence rule works: the hold
// clears when the missing thing is supplied, never because someone dismissed
// it.
export const uploadDocument = async (
    caregiverId,
    documentId,
    { fileName, fileSize, fileType, issuedAt, expiresAt }
) => {
    await delay(500);

    const idx = findCaregiverIdx(caregiverId);
    findDocument(caregivers[idx], documentId);

    if (!fileName?.trim()) {
        throw new Error("Choose a file to record");
    }

    // An expiry is optional: leaving it blank is how a document that never
    // lapses gets recorded, which is a real case and not a missing answer.
    if (expiresAt) {
        const expires = new Date(expiresAt).getTime();

        if (Number.isNaN(expires)) {
            throw new Error("Expiry date is not a valid date");
        }

        // A credential that has already lapsed is not a renewal. Accepting one
        // would let a document be filed straight into the state it is supposed
        // to clear.
        if (expires <= Date.now()) {
            throw new Error("That expiry date has already passed; record a current document");
        }
    }

    const updated = withDocument(caregivers[idx], documentId, {
        fileName: fileName.trim(),
        fileSize: fileSize ?? null,
        fileType: fileType ?? null,
        issuedAt: issuedAt || null,
        expiresAt: expiresAt || null,
        receivedAt: new Date().toISOString(),
        // Recording a document directly SUPERSEDES anything the caregiver sent
        // in. Leaving the submission pending would let someone accept it later
        // and overwrite this newer credential with the older one it replaced.
        submission: null,
    });

    caregivers[idx] = updated;
    return updated;
}
