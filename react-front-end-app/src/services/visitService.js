import { del, post, put, request } from "./apiClient";

// Every filter is optional; an absent one means no restriction.
export const getVisits = async (filters = {}, { signal } = {}) =>
    request("/visits", { signal, params: filters });

// Its own request: the chips count the whole collection, not the filtered list.
export const getVisitCounts = async ({ signal } = {}) =>
    request("/visits/counts", { signal });

// Its own verb because it will differ in authorization, not in query.
export const getVisitsByCaregiver = async (caregiverId, options) => {
    // Fail closed: a missing id must not answer with everybody's visits.
    if (caregiverId == null || caregiverId === "") {
        throw new Error("A caregiver id is required");
    }

    return getVisits({ caregiverId }, options);
}

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
        // 404 is an answer: VisitDetail renders not found for undefined, an error for a throw.
        if (error.status === 404) return undefined;
        throw error;
    }
}

// `?? undefined`, never `?? null`: null would post the JSON document "null".
export const checkInVisit = async (id, location) =>
    post(`/visits/${id}/check-in`, location ?? undefined);

export const checkOutVisit = async (id, evidence) =>
    post(`/visits/${id}/check-out`, evidence);


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
