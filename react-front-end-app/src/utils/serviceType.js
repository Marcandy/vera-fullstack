// WHAT care was delivered.
//
// An EVV record is built around six data elements: who received care, who
// provided it, the date, the time in and out, the location, and the type of
// service. Vera's visit carried five of them and was missing this one
// outright. The gap was easy to miss because the visit has an `assessment`,
// but that is free text a caregiver writes about how the visit went. A
// paragraph saying "assisted with bathing and lunch" is a note, not a service
// code, and nothing can bill, group or audit against it.
//
// (Vera is EVV-inspired and claims no compliance. Carrying the element is
// what makes the record honest; certification is a different thing entirely.)
//
// A controlled vocabulary rather than an open string, for the same reason the
// statuses are one: a typo in a free text column is a visit that quietly
// belongs to no service at all, and it fails at billing time rather than at
// the point of the mistake. This becomes an enum on the entity, persisted by
// name and never by ordinal.
// The VALUE is an identifier and matches the Java enum constant exactly, so the
// same word runs from the MySQL column to this file untranslated. What a person
// reads lives in SERVICE_TYPE_LABEL below.
export const SERVICE_TYPE = {
    // Hands-on assistance with the activities of daily living: bathing,
    // dressing, toileting, transfers, feeding. The bulk of home care.
    PERSONAL_CARE: "PERSONAL_CARE",

    // Household support rather than care of the body: meals, laundry, light
    // housekeeping, shopping, medication reminders.
    HOMEMAKER: "HOMEMAKER",

    // Supervision and company. Billed because presence is the service, which
    // is exactly why it needs verifying.
    COMPANION_CARE: "COMPANION_CARE",

    // Relieving a family caregiver rather than serving the patient directly.
    // The payer and the authorization differ, so it is its own type.
    RESPITE_CARE: "RESPITE_CARE",
};

export const SERVICE_TYPE_LABEL = {
    [SERVICE_TYPE.PERSONAL_CARE]: "Personal care",
    [SERVICE_TYPE.HOMEMAKER]: "Homemaker",
    [SERVICE_TYPE.COMPANION_CARE]: "Companion care",
    [SERVICE_TYPE.RESPITE_CARE]: "Respite care",
};
