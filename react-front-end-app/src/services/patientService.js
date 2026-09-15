import { post, request } from "./apiClient";

// GET /api/patients
export const getPatients = async ({ signal } = {}) =>
    request("/patients", { signal });

// GET /api/patients/{id}. Returns undefined for an id that does not exist
// rather than throwing, matching getVisitById: a page asking about a record
// that is not there needs to render a not-found state, not catch an error.
export const getPatientById = async (id, { signal } = {}) => {
    try {
        return await request(`/patients/${id}`, { signal });
    } catch (error) {
        if (error.status === 404) return undefined;
        throw error;
    }
};

export const addPatient = async (data) => post("/patients", data);
