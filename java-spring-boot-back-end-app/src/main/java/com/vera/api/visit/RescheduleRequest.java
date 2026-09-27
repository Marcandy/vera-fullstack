package com.vera.api.visit;

import java.time.Instant;

public record RescheduleRequest(Instant appointmentTime, Long caregiverId) {
}
