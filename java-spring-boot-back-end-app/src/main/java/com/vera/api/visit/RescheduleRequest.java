package com.vera.api.visit;

import java.time.Instant;

// Time and caregiver, which is what #16's PUT is allowed to change. Patient,
// service type, cost, and evidence are not on this record on purpose: those
// are a different edit, and a scheduled visit has no evidence to rewrite.
public record RescheduleRequest(Instant appointmentTime, Long caregiverId) {
}
