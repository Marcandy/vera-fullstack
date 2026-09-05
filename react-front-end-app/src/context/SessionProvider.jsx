import { useEffect, useState } from "react";
import { SessionContext } from "./sessionContext";
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from "../services/authService";

export const SessionProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // The third state, and the reason this is not just user-or-null. On the
    // first paint we do not yet know whether anyone is signed in, and
    // "unknown" is not "signed out". Without this flag the app renders its
    // logged-out view for one beat and then snaps to the logged-in one.
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let stale = false;
        async function restoreSession() {
            const restored = await getCurrentUser();
            if (!stale) {
                setUser(restored);
                setLoading(false);
            }
        }
        restoreSession();
        return () => { stale = true; };
    }, []);

    // Returns the user as well as storing it. Callers routinely need to act
    // on the result in the same tick, and the `user` they can see from here
    // is the one captured when this render's closure was created, not the
    // one this call just produced. Handing it back is how a caller routes by
    // role immediately instead of reading a value that is still null.
    async function login(email, password) {
        const signedIn = await loginRequest(email, password);
        setUser(signedIn);
        return signedIn;
    }

    // finally, not a plain sequence: if the request ever fails, the local
    // session still has to end. Leaving someone apparently signed in because
    // the sign-out call errored is the wrong way to fail.
    async function logout() {
        try {
            await logoutRequest();
        } finally {
            setUser(null);
        }
    }

    // Not memoized on purpose. This provider re-renders only when user or
    // loading changes, and those are exactly the changes every consumer
    // needs to see, so a useMemo here would guard against nothing.
    return (
        <SessionContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </SessionContext.Provider>
    );
};
