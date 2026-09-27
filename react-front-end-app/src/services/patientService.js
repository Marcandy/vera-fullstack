import { post, request } from "./apiClient";

export const getPatients = async ({ signal } = {}) =>
    request("/patients", { signal });

// Undefined, not a throw: the page renders not found.
export const getPatientById = async (id, { signal } = {}) => {
    try {
        return await request(`/patients/${id}`, { signal });
    } catch (error) {
        if (error.status === 404) return undefined;
        throw error;
    }
};

export const addPatient = async (data) => post("/patients", data);
