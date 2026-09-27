import { useEffect, useState } from "react";
import { SessionContext } from "./sessionContext";
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from "../services/authService";

export const SessionProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // Unknown is not signed out: without this the logged-out view flashes on first paint.
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

    // Returns the user so a caller can route by role now; its `user` is still the old closure's.
    async function login(email, password) {
        const signedIn = await loginRequest(email, password);
        setUser(signedIn);
        return signedIn;
    }

    // finally: the local session ends even if the sign-out request fails.
    async function logout() {
        try {
            await logoutRequest();
        } finally {
            setUser(null);
        }
    }

    return (
        <SessionContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </SessionContext.Provider>
    );
};
