// Device adapter: no backend replaces it, because the device is the authority on
// where it is. Never rejects and never invents coordinates:
//   { available: true,  latitude, longitude, accuracy }
//   { available: false, reason: "denied" | "unavailable" | "timeout" | "unsupported" }

const TIMEOUT_MS = 10000;

// The API's timeout starts only once the prompt is answered; this bounds the whole call.
const UNANSWERED_PROMPT_MS = 15000;

// PositionError codes: 1 denied, 2 unavailable, 3 timeout.
const ERROR_REASONS = {
    1: "denied",
    2: "unavailable",
    3: "timeout",
};

export const getCurrentLocation = () =>
    new Promise((resolve) => {
        // Also the http case: browsers withhold geolocation outside a secure context.
        if (!navigator.geolocation) {
            resolve({ available: false, reason: "unsupported" });
            return;
        }

        const watchdog = setTimeout(
            () => resolve({ available: false, reason: "timeout" }),
            UNANSWERED_PROMPT_MS
        );

        navigator.geolocation.getCurrentPosition(
            (position) => {
                clearTimeout(watchdog);
                resolve({
                    available: true,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            (error) => {
                clearTimeout(watchdog);
                resolve({
                    available: false,
                    reason: ERROR_REASONS[error.code] ?? "unavailable",
                });
            },
            { enableHighAccuracy: true, timeout: TIMEOUT_MS, maximumAge: 0 }
        );
    });
