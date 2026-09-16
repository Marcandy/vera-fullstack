package com.vera.api.visit;

import java.time.Instant;
import java.util.UUID;

import com.vera.api.IllegalTransitionException;
import com.vera.api.NotFoundException;
import com.vera.api.claim.Claim;
import com.vera.api.claim.ClaimRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// The rules live here, not in the controller and not in the entity. They ran in
// the browser until now, which meant they were suggestions.
@Service
public class VisitService {

    private final VisitRepository visits;
    private final ClaimRepository claims;

    VisitService(VisitRepository visits, ClaimRepository claims) {
        this.visits = visits;
        this.claims = claims;
    }

    @Transactional
    public Visit checkIn(Long id, CheckInRequest location) {
        Visit visit = load(id);

        if (visit.getStatus() != VisitStatus.SCHEDULED) {
            throw new IllegalTransitionException(
                    "Cannot check in a visit that is " + visit.getStatus().label());
        }

        // The server stamps the clock: a time the caller could author is not
        // evidence. Location is the exception, because the device is the only
        // authority on where it is, and it never blocks billing.
        visit.setCheckInTime(Instant.now());
        applyLocation(visit, location);
        visit.setStatus(VisitStatus.IN_PROGRESS);

        return visit;
    }

    @Transactional
    public Visit checkOut(Long id, EvidenceRequest evidence) {
        Visit visit = load(id);

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

    @Transactional
    public Visit supplyEvidence(Long id, EvidenceRequest evidence) {
        Visit visit = load(id);

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
        Visit visit = visits.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Visit " + id + " not found"));

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

        // findByIdForUpdate does not join the response relations.
        return load(id);
    }

    // findByIdWithPeople and not findById: open-in-view is false, so the
    // response relations have to be loaded inside this transaction or the controller
    // throws when it maps the response.
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

    // Empty is not evidence, and the client reads null to mean missing.
    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
