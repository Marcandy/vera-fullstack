// Mock user data. Components NEVER import this file directly;
// all access goes through src/services/authService.js.
// A User is whoever signs in. A Caregiver is whoever the agency employs.
// They are separate entities on purpose: Denise has no caregiver record,
// and an office manager will eventually need a login without one.
// caregiverId links a user to src/data/caregivers.js, or is null for a
// pure admin. It is what "my visits" filters on.
// roles is an ARRAY, not a single field, because it maps one to one onto
// Spring Security's authorities collection, and because the owner of a
// small agency really does cover visits herself.
// There are no passwords here. This is a demo sign-in, not authentication,
// and storing even a fake one would invite someone to treat it as real.
export const users = [
    {
        id: 1,
        name: "Denise Carter",
        email: "denise@agency.com",
        roles: ["ADMIN"],
        caregiverId: null
    },
    {
        id: 2,
        name: "Marcus Reed",
        email: "marcus@agency.com",
        roles: ["CAREGIVER"],
        caregiverId: 1
    }
];
