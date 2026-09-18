const API_BASE = "/api";

// Dropped before the query string is built: URLSearchParams turns undefined
// into the literal string "undefined", which the API answers with a 400 on a
// page the user never filtered.
const toQuery = (params = {}) => {
    const entries = Object.entries(params)
        .filter(([, value]) => value !== null && value !== undefined && value !== "");

    return entries.length ? `?${new URLSearchParams(entries)}` : "";
};

export const request = async (path, { signal, params, method = "GET", body } = {}) => {
    let response;

    // Checked against undefined and not truthiness: JSON.stringify(null) is the
    // string "null", a JSON document rather than an absent body, and Spring's
    // @RequestBody(required = false) treats those differently. A bodyless
    // request also sends no Content-Type, which keeps a cross origin GET simple
    // rather than preflighted.
    const hasBody = body !== undefined;

    try {
        response = await fetch(`${API_BASE}${path}${toQuery(params)}`, {
            method,
            signal,
            headers: hasBody ? { "Content-Type": "application/json" } : undefined,
            body: hasBody ? JSON.stringify(body) : undefined,
        });
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
        const errorBody = await response.json().catch(() => ({}));
        const error = new Error(errorBody.message ?? `Request failed (${response.status})`);
        error.status = response.status;
        throw error;
    }

    // 204 and an empty 200 have no JSON document. response.json() would throw
    // on the empty body a DELETE returns.
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
