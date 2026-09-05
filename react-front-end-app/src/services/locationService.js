// Device adapter for the browser's geolocation API. It lives in services/
// because components should not talk to browser APIs directly, but it is a
// different animal from visitService: no backend will ever replace this one,
// since the device is always the authority on where it is.
//
// getCurrentLocation() NEVER rejects. A denied permission is an ordinary
// outcome of a real check-in, not an exception, so every failure comes back
// as a result object the caller can render honestly:
//   { available: true,  latitude, longitude, accuracy }
//   { available: false, reason: "denied" | "unavailable" | "timeout" | "unsupported" }
//
// What it will never do is invent coordinates. A mocked position presented as
// proof of presence is fabricated evidence, the same sin as a typed timestamp.
//
// There is deliberately no "source" field. The spec does not say whether a fix
// came from a GPS radio, wifi trilateration, or an IP lookup, so any value we
// wrote there would be a guess wearing the clothes of a record. accuracy is the
// honest signal: a reading good to 8 m and one good to 130 m are different
// evidence, and the number says so without us naming a method we cannot see.

const TIMEOUT_MS = 10000;

// The API's own timeout does not start until the user answers the permission
// prompt, so a prompt left sitting on screen hangs this promise forever and
// strands the caller's pending flag. This watchdog bounds the whole call
// instead of just the fix acquisition. Whichever settles first wins: calling
// resolve() again after that is a no-op.
const UNANSWERED_PROMPT_MS = 15000;

// The browser's PositionError codes are the contract here:
// 1 PERMISSION_DENIED, 2 POSITION_UNAVAILABLE, 3 TIMEOUT. This lookup gets a
// fallback where our own lookups do not, because these codes come from the
// platform: an unfamiliar one means a browser we did not anticipate, not a
// bug in our data.
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
