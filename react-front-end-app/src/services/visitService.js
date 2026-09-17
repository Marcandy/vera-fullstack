import { del, post, put, request } from "./apiClient";

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
// The filters now travel as the query string and the matching happens in SQL.
// The signature did not have to change, which is the whole point of the
// boundary: no page knows this stopped being an array.
export const getVisits = async (filters = {}, { signal } = {}) =>
    request("/visits", { signal, params: filters });

// GET /api/visits/counts.
//
// Its own request, because the filter chips count the WHOLE collection while
// the list shows one slice of it. The page used to derive both from one array,
// which stopped being possible the moment filtering moved to the server:
// counting the rows that came back would make every chip read either the
// filtered total or zero. Real APIs answer this with facet counts or an
// aggregate endpoint, never from the page they just returned.
export const getVisitCounts = async ({ signal } = {}) =>
    request("/visits/counts", { signal });

// Filtering by id, never by name: names collide and change, ids do not.
// This is GET /api/visits?caregiverId=1, and it delegates rather than
// repeating the predicate, so there is one place where "which visits" is
// decided. Kept as a named verb because the two doors differ in AUTHORIZATION,
// not in query: an admin reads any caregiver's visits this way, while a
// caregiver reading their own becomes GET /api/visits/mine, where the server
// takes the id from the principal and never from a parameter.
export const getVisitsByCaregiver = async (caregiverId, options) => {
    // Required, and it fails rather than defaulting. In getVisits an absent
    // filter means "no restriction", which is right for an optional parameter
    // and catastrophic for a required one: without this guard, asking for a
    // missing caregiver's visits would answer with everybody's. Fail closed on
    // anything to do with whose records these are. This is a 400.
    if (caregiverId == null || caregiverId === "") {
        throw new Error("A caregiver id is required");
    }

    return getVisits({ caregiverId }, options);
}

// GET /api/visits?patientId=1, the patient's care history.
export const getVisitsByPatient = async (patientId, options) => {
    if (patientId == null || patientId === "") {
        throw new Error("A patient id is required");
    }

    return getVisits({ patientId }, options);
}

export const getVisitById = async (id, { signal } = {}) => {
    try {
        return await request(`/visits/${id}`, { signal });
    } catch (error) {
        // 404 is an answer, not a failure. VisitDetail renders not-found for a
        // falsy value and a retryable error when this throws, and those are
        // replies to two different questions.
        if (error.status === 404) return undefined;
        throw error;
    }
}

// The caller supplies the location because the device is the only authority
// on where it is; the service still stamps the clock itself, because a time a
// caller could author is not evidence. Location is metadata either way: it is
// never part of the four-field evidence check, so a caregiver whose phone
// refused permission still produces a billable visit.
// The caller supplies the location because the device is the only authority on
// where it is. The server stamps the clock, because a time the caller could
// author is not evidence. Location never blocks: a refused fix still checks in.
//
// `?? undefined` and never `?? null`: null would post the JSON document "null"
// rather than no body at all.
export const checkInVisit = async (id, location) =>
    post(`/visits/${id}/check-in`, location ?? undefined);

// The four field evidence check moved to the Java service with this. Whether a
// visit lands on ready to bill or needs review is now decided once, server side,
// where a client cannot talk it out of the answer.
export const checkOutVisit = async (id, evidence) =>
    post(`/visits/${id}/check-out`, evidence);


// Issue #20: the Java service owns the evidence merge and resulting status.
export const supplyEvidence = async (id, evidence) =>
    post(`/visits/${id}/evidence`, evidence);

export const submitClaim = async (id) =>
    post(`/visits/${id}/claim`);

export const rescheduleVisit = async (id, { appointmentTime, caregiverId }) =>
    put(`/visits/${id}`, { appointmentTime, caregiverId });

export const cancelVisit = async (id) =>
    del(`/visits/${id}`);

export const scheduleVisit = async ({
    patientId,
    caregiverId,
    appointmentTime,
    serviceType,
    estimatedCost,
}) =>
    post("/visits", { patientId, caregiverId, appointmentTime, serviceType, estimatedCost });
