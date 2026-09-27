import { useEffect, useState } from "react";

// Debounces the input, not the request, so a chip click stays immediate.
export const useDebounced = (value, delayMs) => {
    const [settled, setSettled] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setSettled(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return settled;
};
