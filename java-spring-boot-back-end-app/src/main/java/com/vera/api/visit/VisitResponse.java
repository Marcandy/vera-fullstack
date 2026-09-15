package com.vera.api.visit;

import java.math.BigDecimal;
import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

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

        CheckInLocation checkInLocation,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
        Instant checkOutTime,

        String assessment,
        String patientConcern,
        String signature,
        String claimId,

        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
        Instant submittedAt) {

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
                CheckInLocation.from(visit),
                visit.getCheckOutTime(),
                visit.getAssessment(),
                visit.getPatientConcern(),
                visit.getSignature(),
                visit.getClaim() == null ? null : visit.getClaim().getReference(),
                visit.getClaim() == null ? null : visit.getClaim().getSubmittedAt());
    }

    // Four flat columns become the nested object the browser sent, so what the
    // client reads back is the shape locationService produced.
    //
    // NON_NULL is on THIS record and must never move up to VisitResponse:
    // CaregiverVisit builds its missing evidence list with `visit[field] ===
    // null`, and undefined === null is false, so dropping null keys would empty
    // that list silently on exactly the visits that need it.
    @JsonInclude(JsonInclude.Include.NON_NULL)
    record CheckInLocation(
            boolean available,
            Double latitude,
            Double longitude,
            Double accuracy,
            String reason) {

        // Latitude first: formatLocation calls latitude.toFixed(5) as soon as
        // available is true, so a half built object throws during render.
        static CheckInLocation from(Visit visit) {
            if (visit.getCheckInLatitude() != null) {
                return new CheckInLocation(true, visit.getCheckInLatitude(),
                        visit.getCheckInLongitude(), visit.getCheckInAccuracy(), null);
            }

            if (visit.getCheckInLocationReason() != null) {
                return new CheckInLocation(false, null, null, null,
                        visit.getCheckInLocationReason());
            }

            // Null, not an object. "Not captured" says nobody asked the device;
            // {available: false} would say it was asked and refused.
            return null;
        }
    }
}
