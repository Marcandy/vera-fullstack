// Guarded: an absent value would render "Invalid Date".
export const formatDateTime = (isoString) =>
    isoString
        ? new Date(isoString).toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
        })
        : "—";

export const formatTime = (isoString) =>
    isoString
        ? new Date(isoString).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : "—";

// Date only: an expiry has no meaningful time of day.
export const formatDate = (isoString) =>
    isoString
        ? new Date(isoString).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
        })
        : "Not recorded";

export const formatFileSize = (bytes) => {
    if (!Number.isFinite(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatCurrency = (amount) =>
    amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

// Keys match the reason values in locationService.
const LOCATION_REASONS = {
    denied: "permission denied",
    unavailable: "no signal",
    timeout: "timed out",
    unsupported: "not supported on this device",
};

export const formatLocation = (location) => {
    if (!location) return "Not captured";

    if (!location.available) {
        return `Unavailable (${LOCATION_REASONS[location.reason] ?? "reason unknown"})`;
    }

    const coords = `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;

    return Number.isFinite(location.accuracy)
        ? `${coords} (within ${Math.round(location.accuracy)} m)`
        : coords;
};

export const hoursBetween = (checkIn, checkOut) =>
    ((new Date(checkOut) - new Date(checkIn)) / 3600000).toFixed(1);
