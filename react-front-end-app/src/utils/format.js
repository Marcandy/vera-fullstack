// Shared display formatters. Store ISO strings, format at render.

export const formatDateTime = (isoString) =>
    new Date(isoString).toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
    });

export const formatTime = (isoString) =>
    isoString
        ? new Date(isoString).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : "—";

// Date without a time, for facts that are true for a whole day. A credential
// expires on a date; printing "11:59 PM" beside it would imply a precision
// the record does not have.
export const formatDate = (isoString) =>
    isoString
        ? new Date(isoString).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
        })
        : "Not recorded";

// Bytes as a person reads them. Kept in bytes on the record, because that is
// what the file system reports and what a server would store; rounding
// belongs at render, like every other formatter here.
export const formatFileSize = (bytes) => {
    if (!Number.isFinite(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatCurrency = (amount) =>
    amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

// Human phrases for a location the device could not provide. Keys match the
// reason values in locationService.
const LOCATION_REASONS = {
    denied: "permission denied",
    unavailable: "no signal",
    timeout: "timed out",
    unsupported: "not supported on this device",
};

// Renders a stored checkInLocation as a plain statement of what was captured.
// It never dresses up an absence: an unavailable fix reads as unavailable,
// because a placeholder that looks like a position would be a claim the
// record cannot support.
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

// hours between two ISO strings; Date minus Date yields milliseconds
export const hoursBetween = (checkIn, checkOut) =>
    ((new Date(checkOut) - new Date(checkIn)) / 3600000).toFixed(1);
