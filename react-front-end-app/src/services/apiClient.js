const API_BASE = "/api";

// Spring writes the CSRF token to this cookie and expects it back in the header.
const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "X-XSRF-TOKEN";

let onUnauthorized = () => {};
let sessionVersion = 0;
let csrfBootstrap = null;

// Responses from an earlier session must not sign a newly authenticated user out.
export const markSessionChanged = () => { sessionVersion += 1; };

// The session provider registers here, so a 401 anywhere signs the app out.
export const setUnauthorizedHandler = (handler) => {
    onUnauthorized = handler ?? (() => {});
};

const readCookie = (name) => {
    const entry = document.cookie.split(";").map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(`${name}=`));
    return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
};

// Sign-out clears the token cookie, so the next write fetches a fresh one first.
const csrfToken = async (signal) => {
    if (!readCookie(CSRF_COOKIE)) {
        // One bootstrap prevents concurrent writes from receiving competing tokens.
        csrfBootstrap ??= request("/auth/me").finally(() => { csrfBootstrap = null; });
        await csrfBootstrap;
        signal?.throwIfAborted();
    }
    const token = readCookie(CSRF_COOKIE);
    if (!token) throw new Error("Could not verify your session. Refresh the page and try again.");
    return token;
};

// URLSearchParams would send undefined as the string "undefined".
const toQuery = (params = {}) => {
    const entries = Object.entries(params)
        .filter(([, value]) => value !== null && value !== undefined && value !== "");

    return entries.length ? `?${new URLSearchParams(entries)}` : "";
};

export const request = async (path, { signal, params, method = "GET", body } = {}) => {
    let response;
    const version = sessionVersion;
    method = method.toUpperCase();

    // undefined, not falsy: null would post the JSON document "null".
    const hasBody = body !== undefined;
    const headers = {};
    if (hasBody) headers["Content-Type"] = "application/json";

    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
        headers[CSRF_HEADER] = await csrfToken(signal);
    }

    try {
        response = await fetch(`${API_BASE}${path}${toQuery(params)}`, {
            method,
            signal,
            headers,
            body: hasBody ? JSON.stringify(body) : undefined,
        });
    } catch (cause) {
        // useAsyncData cancelling itself on unmount, not an error to show.
        if (cause.name === "AbortError") throw cause;

        throw new Error("Could not reach the server. Check your connection.", { cause });
    }

    if (response.status === 401 && path !== "/auth/login" && version === sessionVersion) {
        onUnauthorized();
    }

    if (!response.ok) {
        // Callers render err.message verbatim, so keep the server's message.
        const errorBody = await response.json().catch(() => ({}));
        const error = new Error(errorBody.message ?? `Request failed (${response.status})`);
        error.status = response.status;
        throw error;
    }

    // A DELETE's empty body has no JSON to parse.
    if (response.status === 204) return undefined;
    const text = await response.text();
    if (!text) return undefined;
    return JSON.parse(text);
};

export const post = (path, body, options) =>
    request(path, { ...options, method: "POST", body });

export const put = (path, body, options) =>
    request(path, { ...options, method: "PUT", body });

export const del = (path, options) =>
    request(path, { ...options, method: "DELETE" });
