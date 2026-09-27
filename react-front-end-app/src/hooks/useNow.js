import { useEffect, useState } from "react";

// The clock as state, so time-based flags do not freeze at mount.
export const useNow = (intervalMs = 60000) => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(timer);
    }, [intervalMs]);

    return now;
};
