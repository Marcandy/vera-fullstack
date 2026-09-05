import { createContext, useContext } from "react";

// The context object and its reader live here, apart from the provider
// component, because a module that exports both a component and a plain
// function cannot be hot-reloaded: Fast Refresh gives up and does a full
// page reload, taking the state it was meant to preserve with it.
//
// Session only. Not visits, not caregivers, not UI state. Server data in
// here would be a cache with no invalidation, no refetch, and no staleness
// policy, which is the exact gap React Query exists to fill. The admission
// test for anything else: needed at many depths, changes rarely, genuinely
// app-wide.
export const SessionContext = createContext(null);

// Throwing beats returning undefined: a component used outside the provider
// is a wiring mistake, and it should fail at the point of the mistake rather
// than somewhere downstream reading properties of nothing.
export const useSession = () => {
    const session = useContext(SessionContext);

    if (session === null) {
        throw new Error("useSession must be used inside a SessionProvider");
    }

    return session;
};
