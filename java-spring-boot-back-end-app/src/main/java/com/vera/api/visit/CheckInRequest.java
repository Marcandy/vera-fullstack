package com.vera.api.visit;

// Forwarded unchanged from locationService: coordinates when available, a reason
// when not. Boxed Boolean so an absent key differs from false.
public record CheckInRequest(
        Boolean available,
        Double latitude,
        Double longitude,
        Double accuracy,
        String reason) {
}
