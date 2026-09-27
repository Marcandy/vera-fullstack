import { useCallback, useEffect, useRef, useState } from "react";

// One read with loading, error, retry and cancellation. The state is one object, so
// it can never hold an error while still loading.
const LOADING = { status: "loading", data: null, error: null, key: null };

export const useAsyncData = (fetcher, deps = [], { skip = false } = {}) => {
    const [state, setState] = useState(LOADING);

    // Bumping this re-runs the effect, which is how a retry refetches.
    const [reloadKey, setReloadKey] = useState(0);

    // Which inputs produced the data held, so `stale` is derived rather than tracked.
    const key = JSON.stringify(deps);

    // Latest ref: callers pass an inline arrow, so depending on it would refetch forever.
    const fetcherRef = useRef(fetcher);

    // Declared before the fetching effect, so the fetch always sees the current closure.
    useEffect(() => {
        fetcherRef.current = fetcher;
    });

    useEffect(() => {
        if (skip) return;

        let ignore = false;

        const controller = new AbortController();

        (async () => {
            try {
                const data = await fetcherRef.current(controller.signal);
                if (!ignore) setState({ status: "success", data, error: null, key });
            } catch (error) {
                // An abort is this hook cancelling itself, not an error to show.
                if (ignore || controller.signal.aborted || error.name === "AbortError") return;
                setState({ status: "error", data: null, error, key });
            }
        })();

        return () => { ignore = true; controller.abort(); };
        // `key` compares by value, so an inline deps array does not retrigger.
    }, [key, reloadKey, skip]);

    const reload = useCallback(() => {
        setState(LOADING);
        setReloadKey((previous) => previous + 1);
    }, []);

    // Writes a mutation's result in without refetching. Ignored unless data is loaded:
    // a write arriving in any other state is a bug, not a success.
    const setData = useCallback((updater) => {
        setState((previous) => previous.status !== "success" ? previous : {
            ...previous,
            data: typeof updater === "function" ? updater(previous.data) : updater,
        });
    }, []);

    return {
        data: state.data,
        error: state.error,

        // Not true during a refetch, so the previous rows stay on screen.
        loading: state.status === "loading",

        // Showing an answer to inputs that have since changed.
        stale: state.status !== "loading" && state.key !== key,

        reload,
        setData,
    };
};
