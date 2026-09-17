package com.vera.api.visit;

import java.math.BigDecimal;
import java.time.Instant;

// Patient, caregiver, when, what care, and the authorized amount. Evidence
// stays off this record: a visit that has not happened yet has none.
public record ScheduleVisitRequest(
        Long patientId,
        Long caregiverId,
        Instant appointmentTime,
        ServiceType serviceType,
        BigDecimal estimatedCost) {
}
