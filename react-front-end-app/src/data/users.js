// Mock users for the demo sign-in; components go through authService. caregiverId
// is null for an admin. No passwords: this is not authentication.
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
