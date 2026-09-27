const API_BASE = "/api";

// URLSearchParams would send undefined as the string "undefined".
const toQuery = (params = {}) => {
    const entries = Object.entries(params)
        .filter(([, value]) => value !== null && value !== undefined && value !== "");

    return entries.length ? `?${new URLSearchParams(entries)}` : "";
};

export const request = async (path, { signal, params, method = "GET", body } = {}) => {
    let response;

    // undefined, not falsy: null would post the JSON document "null".
    const hasBody = body !== undefined;

    try {
        response = await fetch(`${API_BASE}${path}${toQuery(params)}`, {
            method,
            signal,
            headers: hasBody ? { "Content-Type": "application/json" } : undefined,
            body: hasBody ? JSON.stringify(body) : undefined,
        });
    } catch (cause) {
        // useAsyncData cancelling itself on unmount, not an error to show.
        if (cause.name === "AbortError") throw cause;

        throw new Error("Could not reach the server. Check your connection.", { cause });
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
