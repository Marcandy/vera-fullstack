import { patients } from "../data/patients";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// GET /api/patients
export const getPatients = async () => {
    await delay(300);

    return patients;
}

// GET /api/patients/{id}. Returns undefined for an id that does not exist
// rather than throwing, matching getVisitById: a page asking about a record
// that is not there needs to render a not-found state, not catch an error.
export const getPatientById = async (id) => {
    await delay(300);

    return patients.find((patient) => patient.id === Number(id));
}
