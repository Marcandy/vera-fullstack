import { createContext, useContext } from "react";

// Apart from the provider so Fast Refresh can hot-reload it. Session only: server
// data in context would be a cache with no invalidation.
export const SessionContext = createContext(null);

export const useSession = () => {
    const session = useContext(SessionContext);

    if (session === null) {
        throw new Error("useSession must be used inside a SessionProvider");
    }

    return session;
};
