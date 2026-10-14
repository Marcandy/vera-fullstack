import { startTransition, useEffect, useRef, useState } from "react";
import { SessionContext } from "./sessionContext";
import {
    getCurrentUser,
    login as loginRequest,
    logout as logoutRequest,
    onSessionEnded,
} from "../services/authService";

export const SessionProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // Unknown is not signed out: without this the logged-out view flashes on first paint.
    const [loading, setLoading] = useState(true);
    const [sessionError, setSessionError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const operationVersion = useRef(0);

    useEffect(() => {
        onSessionEnded(() => {
            operationVersion.current += 1;
            setUser(null);
            setLoading(false);
            setSessionError(null);
        });
        return () => onSessionEnded(null);
    }, []);

    useEffect(() => {
        const version = ++operationVersion.current;
        const controller = new AbortController();
        async function restoreSession() {
            try {
                const restored = await getCurrentUser({ signal: controller.signal });
                if (controller.signal.aborted || version !== operationVersion.current) return;
                setUser(restored);
                setSessionError(null);
            } catch (error) {
                if (controller.signal.aborted || version !== operationVersion.current) return;
                setSessionError(error.message);
            } finally {
                if (!controller.signal.aborted && version === operationVersion.current) {
                    setLoading(false);
                }
            }
        }
        restoreSession();
        return () => controller.abort();
    }, [reloadKey]);

    function retrySession() {
        operationVersion.current += 1;
        setLoading(true);
        setSessionError(null);
        setReloadKey((previous) => previous + 1);
    }

    // A late restoration or expired request cannot overwrite a newer sign-in.
    async function login(email, password) {
        const version = ++operationVersion.current;
        try {
            const signedIn = await loginRequest(email, password);
            if (version !== operationVersion.current) {
                throw new Error("Your session changed. Try signing in again.");
            }
            setUser(signedIn);
            setSessionError(null);
            return signedIn;
        } finally {
            if (version === operationVersion.current) {
                setLoading(false);
            }
        }
    }

    // Keep the user signed in when the server cannot confirm sign-out.
    async function logout(onSuccess) {
        const version = ++operationVersion.current;
        await logoutRequest();
        if (version === operationVersion.current) {
            // Match the router's transition so the guard cannot redirect in between.
            startTransition(() => {
                onSuccess?.();
                setUser(null);
                setSessionError(null);
            });
        }
    }

    return (
        <SessionContext.Provider value={{ user, loading, sessionError, retrySession, login, logout }}>
            {children}
        </SessionContext.Provider>
    );
};
