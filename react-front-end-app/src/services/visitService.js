import { visits } from "../data/visits";
import { VISIT_STATUS } from "../utils/status";
import { countByStatus } from "../utils/visits";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const findIdx = (id) => {
    const idx = visits.findIndex((visit) => visit.id === Number(id));
    if (idx === -1) {
        throw new Error(`Visit ${id} not found`)
    }
    return idx;
}

// GET /api/visits, with the filters as query parameters.
//
// Filtering used to live in the page, over the array it already held. That
// works for fourteen rows and is the wrong shape for anything else: the moment
// a server returns the first page of two hundred visits, "filter what you have
// in hand" answers a different question, because the rows that would match are
// the ones that were never sent. The question has to travel with the request,
// which is what a query string is for. This signature is the controller
// signature.
//
// Every parameter is optional, and an absent one means no restriction, so the
// callers that want the whole collection still call getVisits() with nothing.
//
// It also returns a NEW array rather than the live seed. getVisits() used to
// hand back the module's own array, which meant a caller could sort or splice
// the data source out from under every other screen. A real endpoint cannot
// leak its table, and filter() already builds a copy for free.
export const getVisits = async ({ status, q, caregiverId, patientId } = {}) => {
    await delay(300);

    // Trimmed and folded once, not per row. Blank or whitespace-only means no
    // search at all rather than a match against the empty string.
    const needle = q?.trim().toLowerCase();

    return visits.filter((visit) => {
        if (status && visit.status !== status) return false;
        if (caregiverId != null && visit.caregiverId !== Number(caregiverId)) return false;
        if (patientId != null && visit.patientId !== Number(patientId)) return false;

        // Names only. Searching the assessment would quietly turn a caregiver's
        // clinical note into a search surface, which is a different feature and
        // a privacy decision nobody made.
        if (needle) {
            const names = `${visit.patientName} ${visit.caregiverName}`.toLowerCase();
            if (!names.includes(needle)) return false;
        }

        return true;
    });
}

// GET /api/visits/counts.
//
// Its own request, because the filter chips count the WHOLE collection while
// the list shows one slice of it. The page used to derive both from one array,
// which stopped being possible the moment filtering moved to the server:
// counting the rows that came back would make every chip read either the
// filtered total or zero. Real APIs answer this with facet counts or an
// aggregate endpoint, never from the page they just returned.
export const getVisitCounts = async () => {
    await delay(300);

    return {
        total: visits.length,
        byStatus: countByStatus(visits),
    };
}

// Filtering by id, never by name: names collide and change, ids do not.
// This is GET /api/visits?caregiverId=1, and it delegates rather than
// repeating the predicate, so there is one place where "which visits" is
// decided. Kept as a named verb because the two doors differ in AUTHORIZATION,
// not in query: an admin reads any caregiver's visits this way, while a
// caregiver reading their own becomes GET /api/visits/mine, where the server
// takes the id from the principal and never from a parameter.
export const getVisitsByCaregiver = async (caregiverId) => {
    // Required, and it fails rather than defaulting. In getVisits an absent
    // filter means "no restriction", which is right for an optional parameter
    // and catastrophic for a required one: without this guard, asking for a
    // missing caregiver's visits would answer with everybody's. Fail closed on
    // anything to do with whose records these are. This is a 400.
    if (caregiverId == null || caregiverId === "") {
        throw new Error("A caregiver id is required");
    }

    return getVisits({ caregiverId });
}

// GET /api/visits?patientId=1, the patient's care history.
export const getVisitsByPatient = async (patientId) => {
    if (patientId == null || patientId === "") {
        throw new Error("A patient id is required");
    }

    return getVisits({ patientId });
}

export const getVisitById = async (id) => {
    await delay(300);

    return visits.find((visit) => visit.id === Number(id));
}

// The caller supplies the location because the device is the only authority
// on where it is; the service still stamps the clock itself, because a time a
// caller could author is not evidence. Location is metadata either way: it is
// never part of the four-field evidence check, so a caregiver whose phone
// refused permission still produces a billable visit.
export const checkInVisit = async (id, location) => {
    await delay(300);

    const idx = findIdx(id)

    if (visits[idx].status !== VISIT_STATUS.SCHEDULED) {
       throw new Error(`Cannot check in a visit that is ${visits[idx].status}`)
    }

    visits[idx] = {...visits[idx],
        status: VISIT_STATUS.IN_PROGRESS,
        checkInTime: new Date().toISOString(),
        checkInLocation: location ?? null
    }

    return visits[idx];

}

export const checkOutVisit = async (id, { assessment, signature }) => {
    await delay(300);

    const idx = findIdx(id)

    if (visits[idx].status !== VISIT_STATUS.IN_PROGRESS ) {
        throw new Error (`Cannot check out a visit that is ${visits[idx].status}`);
    }
     
    // empty string is not evidence, null is what the frontend will read
    const cleanAssessment = assessment?.trim() ? assessment.trim() : null;
    const cleanSignature = signature?.trim() ? signature.trim() : null;

    const MOCK_VISIT_MINUTES = 90;
    const checkOutTime = new Date(
        new Date(visits[idx].checkInTime).getTime() + MOCK_VISIT_MINUTES * 60000
    ).toISOString();

    const updated = {
        ...visits[idx],
        assessment: cleanAssessment,
        signature: cleanSignature,
        checkOutTime: checkOutTime,
    }

    // evidence check for four field

    const evidenceComplete = 
        updated.checkInTime && updated.checkOutTime &&
        updated.assessment && updated.signature;

    updated.status = evidenceComplete ? VISIT_STATUS.READY_TO_BILL : VISIT_STATUS.NEEDS_REVIEW;

    visits[idx] = updated;
    // return the update object
    return updated;
}


export const supplyEvidence = async(id, {assessment, signature}) => {
    await delay(300)

    const idx = findIdx(id);

    if(visits[idx].status !== VISIT_STATUS.NEEDS_REVIEW) {
        throw new Error(`Cannot supply evidence to a visit that is ${visits[idx].status}`);
    }

    // empty string is not evidence, null is for the frontend
    const cleanAssessment = assessment?.trim() ? assessment.trim() : null;
    const cleanSignature = signature?.trim() ? signature.trim() : null;

    // merge, supplying nothing keeps what exist
    const updated = {
        ...visits[idx],
        assessment: cleanAssessment ?? visits[idx].assessment,
        signature: cleanSignature ?? visits[idx].signature
    }

    // same evidence as checkout
    const evidenceComplete = 
        updated.checkInTime && updated.checkOutTime &&
        updated.assessment && updated.signature;

    updated.status = evidenceComplete ? VISIT_STATUS.READY_TO_BILL : VISIT_STATUS.NEEDS_REVIEW;

    visits[idx] = updated;
    return updated
}

export const submitClaim = async (id) => {
    await delay(700);

    const idx = findIdx(id);

    if(visits[idx].status !== VISIT_STATUS.READY_TO_BILL) {
        throw new Error(`Cannot submit a claim for a visit that is ${visits[idx].status}`)
    }

    const updated = {
        ...visits[idx],
        status: VISIT_STATUS.BILLED,
        submittedAt: new Date().toISOString(),
        claimId: `clm_mock_${id}`
    }
    visits[idx] = updated;
    return updated;
}