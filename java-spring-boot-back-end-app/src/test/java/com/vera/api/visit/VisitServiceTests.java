package com.vera.api.visit;

import java.time.Instant;
import java.util.Optional;

import com.vera.api.IllegalTransitionException;
import com.vera.api.claim.ClaimRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class VisitServiceTests {

    private static final Instant CHECK_IN = Instant.parse("2026-09-14T13:00:00Z");
    private static final Instant CHECK_OUT = Instant.parse("2026-09-14T14:00:00Z");

    private Visit visit;
    private VisitService service;

    @BeforeEach
    void setUp() {
        visit = new Visit();
        visit.setStatus(VisitStatus.NEEDS_REVIEW);
        visit.setCheckInTime(CHECK_IN);
        visit.setCheckOutTime(CHECK_OUT);
        visit.setAssessment("Helped with meals");

        VisitRepository visits = mock(VisitRepository.class);
        when(visits.findByIdWithPeople(1L)).thenReturn(Optional.of(visit));
        service = new VisitService(visits, mock(ClaimRepository.class));
    }

    @Test
    void supplyingSignaturePreservesAssessmentAndTimestamps() {
        Visit updated = service.supplyEvidence(1L, new EvidenceRequest("  ", "  Eleanor  "));

        assertEquals("Helped with meals", updated.getAssessment());
        assertEquals("Eleanor", updated.getSignature());
        assertEquals(CHECK_IN, updated.getCheckInTime());
        assertEquals(CHECK_OUT, updated.getCheckOutTime());
        assertEquals(VisitStatus.READY_TO_BILL, updated.getStatus());
    }

    @Test
    void supplyingAssessmentPreservesSignature() {
        visit.setAssessment(null);
        visit.setSignature("Eleanor");

        Visit updated = service.supplyEvidence(1L, new EvidenceRequest("  Helped with meals  ", ""));

        assertEquals("Helped with meals", updated.getAssessment());
        assertEquals("Eleanor", updated.getSignature());
        assertEquals(VisitStatus.READY_TO_BILL, updated.getStatus());
    }

    @Test
    void emptyEvidenceDoesNotEraseAssessmentOrClearHold() {
        for (EvidenceRequest evidence : new EvidenceRequest[] {
                null, new EvidenceRequest(null, null), new EvidenceRequest("", " \t ") }) {
            Visit updated = service.supplyEvidence(1L, evidence);

            assertEquals("Helped with meals", updated.getAssessment());
            assertNull(updated.getSignature());
            assertEquals(VisitStatus.NEEDS_REVIEW, updated.getStatus());
        }
    }

    @Test
    void missingCheckOutKeepsHoldWithoutInventingTime() {
        visit.setCheckOutTime(null);

        Visit updated = service.supplyEvidence(1L, new EvidenceRequest(null, "Eleanor"));

        assertEquals("Eleanor", updated.getSignature());
        assertNull(updated.getCheckOutTime());
        assertEquals(VisitStatus.NEEDS_REVIEW, updated.getStatus());
    }

    @Test
    void missingCheckInKeepsHoldWithoutInventingTime() {
        visit.setCheckInTime(null);

        Visit updated = service.supplyEvidence(1L, new EvidenceRequest(null, "Eleanor"));

        assertEquals("Eleanor", updated.getSignature());
        assertNull(updated.getCheckInTime());
        assertEquals(VisitStatus.NEEDS_REVIEW, updated.getStatus());
    }

    @Test
    void otherStatusesRejectEvidenceWithoutChangingTheVisit() {
        for (VisitStatus status : VisitStatus.values()) {
            if (status == VisitStatus.NEEDS_REVIEW) continue;
            visit.setStatus(status);

            assertThrows(IllegalTransitionException.class,
                    () -> service.supplyEvidence(1L, new EvidenceRequest("Replacement", "Eleanor")));

            assertEquals("Helped with meals", visit.getAssessment());
            assertNull(visit.getSignature());
            assertEquals(status, visit.getStatus());
        }
    }
}
