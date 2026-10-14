import { markSessionChanged, post, request, setUnauthorizedHandler } from "./apiClient";

// The server holds the session in an HttpOnly cookie; nothing is stored here.
export const login = async (email, password) => {
    if (!email?.trim()) throw new Error("Email is required");
    if (!password?.trim()) throw new Error("Password is required");

    markSessionChanged();
    const user = await post("/auth/login", { email: email.trim(), password });
    markSessionChanged();
    return user;
};

// 204 when nobody is signed in, which the client returns as undefined.
export const getCurrentUser = async (options) => (await request("/auth/me", options)) ?? null;

export const logout = async () => {
    markSessionChanged();
    try {
        await post("/auth/logout");
    } catch (error) {
        if (error.status !== 401) throw error;
    }
    markSessionChanged();
};

export const onSessionEnded = (handler) => setUnauthorizedHandler(handler);
