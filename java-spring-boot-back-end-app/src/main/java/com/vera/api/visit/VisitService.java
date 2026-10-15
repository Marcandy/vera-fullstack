package com.vera.api.visit;

import static com.vera.api.Inputs.blankToNull;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import com.vera.api.IllegalTransitionException;
import com.vera.api.InvalidInputException;
import com.vera.api.NotFoundException;
import com.vera.api.auth.CurrentUser;
import com.vera.api.caregiver.Caregiver;
import com.vera.api.caregiver.CaregiverRepository;
import com.vera.api.claim.Claim;
import com.vera.api.claim.ClaimRepository;
import com.vera.api.patient.Patient;
import com.vera.api.patient.PatientRepository;

import org.springframework.stereotype.Service;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@PreAuthorize("hasRole('ADMIN')")
public class VisitService {

    private final VisitRepository visits;
    private final ClaimRepository claims;
    private final CaregiverRepository caregivers;
    private final PatientRepository patients;
    private final CurrentUser currentUser;

    VisitService(VisitRepository visits, ClaimRepository claims,
            CaregiverRepository caregivers, PatientRepository patients, CurrentUser currentUser) {
        this.visits = visits;
        this.claims = claims;
        this.caregivers = caregivers;
        this.patients = patients;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<Visit> search(VisitStatus status, String q, Long caregiverId, Long patientId) {
        String search = StringUtils.hasText(q) ? q.trim() : null;
        return visits.search(status, search, caregiverId, patientId);
    }

    @Transactional(readOnly = true)
    public VisitCounts counts() {
        Map<VisitStatus, Long> byStatus = visits.countByStatus().stream()
                .collect(Collectors.toMap(VisitRepository.StatusCount::getStatus,
                        VisitRepository.StatusCount::getCount));
        long total = byStatus.values().stream().mapToLong(Long::longValue).sum();
        return new VisitCounts(total, byStatus);
    }

    @PreAuthorize("hasRole('CAREGIVER')")
    @Transactional(readOnly = true)
    public List<Visit> mine() {
        return visits.search(null, null, currentUser.caregiverId(), null);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'CAREGIVER')")
    @Transactional(readOnly = true)
    public Visit findById(Long id) {
        Visit visit = load(id);
        if (!currentUser.isAdmin()) {
            currentUser.requireOwnership(visit.getCaregiver().getId());
        }
        return visit;
    }

    @PreAuthorize("hasRole('CAREGIVER')")
    @Transactional
    public Visit checkIn(Long id, CheckInRequest location) {
        Visit visit = loadOwnedForUpdate(id);

        if (visit.getStatus() != VisitStatus.SCHEDULED) {
            throw new IllegalTransitionException(
                    "Cannot check in a visit that is " + visit.getStatus().label());
        }

        // The server stamps the time; the device supplies location because it is the only
        // authority on where it is.
        visit.setCheckInTime(Instant.now());
        applyLocation(visit, location);
        visit.setStatus(VisitStatus.IN_PROGRESS);

        return visit;
    }

    @PreAuthorize("hasRole('CAREGIVER')")
    @Transactional
    public Visit checkOut(Long id, EvidenceRequest evidence) {
        Visit visit = loadOwnedForUpdate(id);

        if (visit.getStatus() != VisitStatus.IN_PROGRESS) {
            throw new IllegalTransitionException(
                    "Cannot check out a visit that is " + visit.getStatus().label());
        }

        String assessment = evidence == null ? null : evidence.assessment();
        String signature = evidence == null ? null : evidence.signature();

        visit.setCheckOutTime(Instant.now());
        visit.setAssessment(blankToNull(assessment));
        visit.setSignature(blankToNull(signature));
        visit.setStatus(hasCompleteEvidence(visit)
                ? VisitStatus.READY_TO_BILL
                : VisitStatus.NEEDS_REVIEW);

        return visit;
    }

    @PreAuthorize("hasRole('CAREGIVER')")
    @Transactional
    public Visit supplyEvidence(Long id, EvidenceRequest evidence) {
        Visit visit = loadOwnedForUpdate(id);

        if (visit.getStatus() != VisitStatus.NEEDS_REVIEW) {
            throw new IllegalTransitionException(
                    "Cannot supply evidence to a visit that is " + visit.getStatus().label());
        }

        String assessment = blankToNull(evidence == null ? null : evidence.assessment());
        String signature = blankToNull(evidence == null ? null : evidence.signature());

        // Supplying a missing field must not erase evidence already recorded.
        if (assessment != null) {
            visit.setAssessment(assessment);
        }

        if (signature != null) {
            visit.setSignature(signature);
        }

        visit.setStatus(hasCompleteEvidence(visit)
                ? VisitStatus.READY_TO_BILL
                : VisitStatus.NEEDS_REVIEW);

        return visit;
    }

    @Transactional
    public Visit submitClaim(Long id) {
        Visit visit = loadForUpdate(id);

        if (visit.getStatus() != VisitStatus.READY_TO_BILL) {
            throw new IllegalTransitionException(
                    "Cannot submit a claim for a visit that is " + visit.getStatus().label());
        }

        Claim claim = new Claim(
                visit,
                "clm_" + UUID.randomUUID(),
                visit.getEstimatedCost(),
                Instant.now()
        );
        Claim saved = claims.save(claim);
        visit.setClaim(saved);
        visit.setStatus(VisitStatus.BILLED);

        return visit;
    }

    @Transactional
    public Visit reschedule(Long id, RescheduleRequest request) {
        Visit visit = loadForUpdate(id);

        if (visit.getStatus() != VisitStatus.SCHEDULED) {
            throw new IllegalTransitionException(
                    "Cannot reschedule a visit that is " + visit.getStatus().label());
        }

        if (request == null) {
            throw new InvalidInputException("Reschedule request is required");
        }
        if (request.appointmentTime() == null) {
            throw new InvalidInputException("Appointment time is required");
        }
        if (request.caregiverId() == null) {
            throw new InvalidInputException("Caregiver id is required");
        }

        Caregiver caregiver = caregivers.findById(request.caregiverId())
                .orElseThrow(() -> new NotFoundException(
                        "Caregiver " + request.caregiverId() + " not found"));

        visit.setAppointmentTime(request.appointmentTime());
        visit.setCaregiver(caregiver);
        return load(id);
    }

    @Transactional
    public Visit cancel(Long id) {
        Visit visit = loadForUpdate(id);

        if (visit.getStatus() != VisitStatus.SCHEDULED) {
            throw new IllegalTransitionException(
                    "Cannot cancel a visit that is " + visit.getStatus().label());
        }

        visit.setStatus(VisitStatus.CANCELLED);
        return visit;
    }

    @Transactional
    public Visit schedule(ScheduleVisitRequest request) {
        if (request == null) {
            throw new InvalidInputException("Schedule request is required");
        }
        if (request.patientId() == null) {
            throw new InvalidInputException("Patient id is required");
        }
        if (request.caregiverId() == null) {
            throw new InvalidInputException("Caregiver id is required");
        }
        if (request.appointmentTime() == null) {
            throw new InvalidInputException("Appointment time is required");
        }
        if (request.serviceType() == null) {
            throw new InvalidInputException("Service type is required");
        }
        if (request.estimatedCost() == null) {
            throw new InvalidInputException("Estimated cost is required");
        }

        Patient patient = patients.findById(request.patientId())
                .orElseThrow(() -> new NotFoundException(
                        "Patient " + request.patientId() + " not found"));
        Caregiver caregiver = caregivers.findById(request.caregiverId())
                .orElseThrow(() -> new NotFoundException(
                        "Caregiver " + request.caregiverId() + " not found"));

        Visit visit = new Visit();
        visit.setPatient(patient);
        visit.setCaregiver(caregiver);
        visit.setAppointmentTime(request.appointmentTime());
        visit.setServiceType(request.serviceType());
        visit.setEstimatedCost(request.estimatedCost());
        visit.setStatus(VisitStatus.SCHEDULED);

        Visit saved = visits.save(visit);
        return load(saved.getId());
    }

    // Lock before reading ownership or status so reassignment and evidence cannot race.
    private Visit loadOwnedForUpdate(Long id) {
        Visit visit = loadForUpdate(id);
        currentUser.requireOwnership(visit.getCaregiver().getId());
        return visit;
    }

    private Visit loadForUpdate(Long id) {
        visits.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Record not found"));
        return load(id);
    }

    // open-in-view is false, so the response relations load inside this transaction.
    private Visit load(Long id) {
        return visits.findByIdWithPeople(id)
                .orElseThrow(() -> new NotFoundException("Visit " + id + " not found"));
    }

    // Coordinates or a reason, never both, or the UI reports a position for a
    // fix that was refused.
    private static void applyLocation(Visit visit, CheckInRequest location) {
        if (location == null) {
            return;
        }

        if (Boolean.TRUE.equals(location.available())) {
            visit.setCheckInLatitude(location.latitude());
            visit.setCheckInLongitude(location.longitude());
            visit.setCheckInAccuracy(location.accuracy());
        } else {
            visit.setCheckInLocationReason(location.reason());
        }
    }

    // The evidence rule. All four, no override, and location is not one of them.
    private static boolean hasCompleteEvidence(Visit visit) {
        return visit.getCheckInTime() != null
                && visit.getCheckOutTime() != null
                && visit.getAssessment() != null
                && visit.getSignature() != null;
    }
}
