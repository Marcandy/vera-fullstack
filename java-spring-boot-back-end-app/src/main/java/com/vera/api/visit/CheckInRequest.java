package com.vera.api.visit;

// The shape locationService.getCurrentLocation() already resolves in the
// browser, so the caregiver's device result is forwarded unchanged rather than
// translated on the way out.
//
// The two branches are mutually exclusive: available true carries coordinates
// and no reason, available false carries a reason and no coordinates.
//
// Boxed Boolean so an absent key stays distinguishable from false.
public record CheckInRequest(
        Boolean available,
        Double latitude,
        Double longitude,
        Double accuracy,
        String reason) {
}
