import { useEffect, useState } from "react";

// Time is an input, and inputs change. A value derived from Date.now() at
// render is correct exactly once: leave the dashboard open and its "late"
// flags stay frozen at whatever the clock said when the page mounted, with
// nothing in the code looking wrong.
//
// So the clock becomes state and ticks. A minute is the right granularity
// for thresholds measured in minutes; ticking every second would re-render
// sixty times more often to move the same flags at the same moments.
//
// The interval is the textbook case for effect cleanup: without the
// clearInterval, every mount leaks a timer that keeps calling setState on a
// component that is gone, and StrictMode's double mount in development
// would leave two of them running at once.
export const useNow = (intervalMs = 60000) => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(timer);
    }, [intervalMs]);

    return now;
};
