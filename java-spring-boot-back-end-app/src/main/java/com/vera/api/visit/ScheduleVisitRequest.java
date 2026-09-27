package com.vera.api.visit;

import java.math.BigDecimal;
import java.time.Instant;

public record ScheduleVisitRequest(
        Long patientId,
        Long caregiverId,
        Instant appointmentTime,
        ServiceType serviceType,
        BigDecimal estimatedCost) {
}
