
const API_BASE = "/api";

// Dropped before the query string is built: URLSearchParams turns undefined
// into the literal string "undefined", which the API answers with a 400 on a
// page the user never filtered.
const toQuery = (params = {}) => {
    const entries = Object.entries(params)
        .filter(([, value]) => value !== null && value !== undefined && value !== "");

    return entries.length ? `?${new URLSearchParams(entries)}` : "";
};

export const request = async (path, { signal, params } = {}) => {
    let response;

    try {
        response = await fetch(`${API_BASE}${path}${toQuery(params)}`, { signal });
    } catch (cause) {
        // An abort is useAsyncData cancelling itself on unmount. It must pass
        // through untouched or every navigation paints an error on the way out.
        if (cause.name === "AbortError") throw cause;

        // The caregiver reads the message; the original TypeError rides along
        // as cause so a console still shows what actually failed.
        throw new Error("Could not reach the server. Check your connection.", { cause });
    }

    if (!response.ok) {
        // Every catch site renders err.message verbatim, so the server's
        // message has to survive. status rides along for callers that need to
        // tell one failure from another.
        const body = await response.json().catch(() => ({}));
        const error = new Error(body.message ?? `Request failed (${response.status})`);
        error.status = response.status;
        throw error;
    }

    return response.json();
};
