package com.vera.api;

// One component, because the React client reads exactly one field. Every catch
// site in the app renders err.message verbatim to a person.
public record ApiError(String message) {
}
