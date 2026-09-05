// Role names in one place, from day one. The visit statuses are still
// scattered as literals across seven files and have caused three typo bugs;
// there is no reason to repeat that with a second vocabulary.
export const ROLES = {
    ADMIN: "ADMIN",
    CAREGIVER: "CAREGIVER",
};

// Deliberately a plain function rather than something the Context exposes.
// The Context's job is to hold who is signed in; deciding what a role means
// is policy, and policy that lives in the provider is policy every consumer
// has to accept. Callers ask their own questions.
export const hasRole = (user, role) => Boolean(user?.roles?.includes(role));
