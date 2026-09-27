export const ROLES = {
    ADMIN: "ADMIN",
    CAREGIVER: "CAREGIVER",
};

export const hasRole = (user, role) => Boolean(user?.roles?.includes(role));
