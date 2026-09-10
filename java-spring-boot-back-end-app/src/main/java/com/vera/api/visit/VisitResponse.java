package com.vera.api.visit;

import java.math.BigDecimal;
import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonFormat;

// Ids AND names, so rendering a list needs no second call per row. This is the
// shape the client already reads; the entity behind it is not.
public record VisitResponse(
        Long id,
        Long patientId,
        String patientName,
        Long caregiverId,
        String caregiverName,

        // Pinned to match JavaScript's toISOString() exactly. Left to Jackson,
        // whole seconds lose their ".000" and the client's string sort breaks.
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
        Instant appointmentTime,

        VisitStatus status,
        ServiceType serviceType,
        BigDecimal estimatedCost,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
        Instant checkInTime,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
        Instant checkOutTime,

        String assessment,
        String patientConcern,
        String signature) {

    static VisitResponse from(Visit visit) {
        return new VisitResponse(
                visit.getId(),
                visit.getPatient().getId(),
                visit.getPatient().getName(),
                visit.getCaregiver().getId(),
                visit.getCaregiver().getName(),
                visit.getAppointmentTime(),
                visit.getStatus(),
                visit.getServiceType(),
                visit.getEstimatedCost(),
                visit.getCheckInTime(),
                visit.getCheckOutTime(),
                visit.getAssessment(),
                visit.getPatientConcern(),
                visit.getSignature());
    }
}
