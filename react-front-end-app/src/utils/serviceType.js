// The EVV service type element. Values match the Java enum constants; wording lives
// in SERVICE_TYPE_LABEL.
export const SERVICE_TYPE = {
    // Hands-on help with daily living: bathing, dressing, toileting, feeding.
    PERSONAL_CARE: "PERSONAL_CARE",

    // Household support: meals, laundry, housekeeping, shopping.
    HOMEMAKER: "HOMEMAKER",

    // Supervision and company.
    COMPANION_CARE: "COMPANION_CARE",

    // Relieving a family caregiver.
    RESPITE_CARE: "RESPITE_CARE",
};

export const SERVICE_TYPE_LABEL = {
    [SERVICE_TYPE.PERSONAL_CARE]: "Personal care",
    [SERVICE_TYPE.HOMEMAKER]: "Homemaker",
    [SERVICE_TYPE.COMPANION_CARE]: "Companion care",
    [SERVICE_TYPE.RESPITE_CARE]: "Respite care",
};
