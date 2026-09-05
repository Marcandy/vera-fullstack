import { useEffect, useState } from "react";

/**
 * A value that lags behind, so a fast-changing input becomes a slow-changing
 * one.
 *
 * The debounce belongs to the INPUT, not to the request. That distinction is
 * what makes this three lines instead of an option threaded through
 * useAsyncData: the search box is the thing being typed into, so it is the
 * thing that should wait. Everything downstream then reacts to a value that
 * simply changes less often, and a status chip click, which is not typed, stays
 * immediate without anyone special-casing it.
 *
 * The cleanup is the whole mechanism. Every keystroke cancels the previous
 * timer, so the value only settles once the typing stops.
 */
export const useDebounced = (value, delayMs) => {
    const [settled, setSettled] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setSettled(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return settled;
};
