import { useCallback, useEffect, useRef, useState } from "react";

/**
 * One read, one place.
 *
 * Nine pages each owned the same twenty lines: state for the data, state for
 * the error, a counter to force a retry, an async function declared inside an
 * effect, a `stale` flag closed over by its cleanup, and a try/catch that had
 * to remember to check that flag in both branches. Nine copies of something
 * that subtle is nine chances to get one wrong, and they had already drifted:
 * some tracked a separate loading boolean, some inferred it from a null.
 *
 * THE STATE IS ONE OBJECT, not three. Separate data, error and loading
 * variables can describe situations that cannot happen, like holding an error
 * while still loading, and then the render has to decide which one it believes.
 * A single value transitions atomically and can only say one thing at a time.
 */
const LOADING = { status: "loading", data: null, error: null, key: null };

export const useAsyncData = (fetcher, deps = [], { skip = false } = {}) => {
    const [state, setState] = useState(LOADING);

    // Bumping this re-runs the effect, which is what a retry needs: the request
    // is the effect's job, so asking again means asking for the effect again
    // rather than calling the service from a click handler.
    const [reloadKey, setReloadKey] = useState(0);

    // Which inputs produced the data currently held. Comparing it to the inputs
    // now lets "are we showing the answer to an older question" be DERIVED
    // rather than tracked in a second flag that can disagree with the data.
    // Deps are the same primitives a dependency array already requires.
    const key = JSON.stringify(deps);

    // The LATEST REF pattern, and the reason this hook takes an explicit deps
    // array instead of depending on the function it was given. Callers pass an
    // inline arrow, which is a new function every render, so depending on it
    // would refetch forever. Reading it from a ref means the effect always calls
    // the current closure while re-running only when the caller says its inputs
    // changed.
    const fetcherRef = useRef(fetcher);

    // Updated in an effect rather than assigned during render, which React
    // rightly rejects. Effects run in declaration order on every commit, so this
    // lands before the fetching effect below and the fetch always sees the
    // current closure. useRef's initial value covers the first render, before
    // any effect has run.
    useEffect(() => {
        fetcherRef.current = fetcher;
    });

    useEffect(() => {
        if (skip) return;

        let ignore = false;

        // Cancels the request itself, not merely its result. The ignore flag
        // stops a late answer being written to state; the controller stops the
        // work happening at all, so navigating away mid-request does not leave
        // the network finishing something nobody is waiting for.
        const controller = new AbortController();

        (async () => {
            try {
                const data = await fetcherRef.current(controller.signal);
                if (!ignore) setState({ status: "success", data, error: null, key });
            } catch (error) {
                // An abort is this hook cancelling itself, not a failure worth
                // showing anyone. Without this, navigating away would paint an
                // error on the way out.
                if (ignore || controller.signal.aborted || error.name === "AbortError") return;
                setState({ status: "error", data: null, error, key });
            }
        })();

        return () => { ignore = true; controller.abort(); };
        // `key` stands in for the caller's deps: a string, so it compares by
        // value, which also means an inline array literal does not retrigger.
    }, [key, reloadKey, skip]);

    const reload = useCallback(() => {
        setState(LOADING);
        setReloadKey((previous) => previous + 1);
    }, []);

    /**
     * Writes a mutation's result straight in, instead of refetching to learn
     * what the server already told us. Signing a document returns the updated
     * caregiver, so asking again would be a second round trip with a flash of
     * stale rows in between.
     *
     * Ignored unless data is already loaded: a mutation cannot finish before the
     * read it mutates, so a write arriving in any other state means something is
     * wrong, and inventing a success would hide it.
     */
    const setData = useCallback((updater) => {
        setState((previous) => previous.status !== "success" ? previous : {
            ...previous,
            data: typeof updater === "function" ? updater(previous.data) : updater,
        });
    }, []);

    return {
        data: state.data,
        error: state.error,

        // Nothing to show yet. Deliberately NOT true during a refetch: keeping
        // the previous rows on screen while new ones load beats flashing an
        // empty page on every filter change.
        loading: state.status === "loading",

        // Showing an answer to inputs that have since changed. This is what a
        // "refreshing" hint renders from, and it is derived, so it cannot
        // disagree with the data it describes.
        stale: state.status !== "loading" && state.key !== key,

        reload,
        setData,
    };
};
