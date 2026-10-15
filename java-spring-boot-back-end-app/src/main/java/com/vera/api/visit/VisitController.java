package com.vera.api.visit;

import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/visits")
public class VisitController {

    private final VisitService visitService;

    VisitController(VisitService visitService) {
        this.visitService = visitService;
    }

    @GetMapping
    public List<VisitResponse> getVisits(
            @RequestParam(required = false) VisitStatus status,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long caregiverId,
            @RequestParam(required = false) Long patientId) {

        return visitService.search(status, q, caregiverId, patientId).stream()
                .map(VisitResponse::from)
                .toList();
    }

    @GetMapping("/mine")
    public List<VisitResponse> getMyVisits() {
        return visitService.mine().stream().map(VisitResponse::from).toList();
    }

    // The chips count the whole collection, not the filtered list.
    @GetMapping("/counts")
    public VisitCounts getVisitCounts() {
        return visitService.counts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<VisitResponse> getVisitById(@PathVariable Long id) {
        return ResponseEntity.ok(VisitResponse.from(visitService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<VisitResponse> schedule(
            @RequestBody(required = false) ScheduleVisitRequest request) {
        Visit visit = visitService.schedule(request);
        return ResponseEntity.created(URI.create("/api/visits/" + visit.getId()))
                .body(VisitResponse.from(visit));
    }

    // required = false: a caregiver who denied location still checks in.
    @PostMapping("/{id}/check-in")
    public VisitResponse checkIn(@PathVariable Long id,
            @RequestBody(required = false) CheckInRequest location) {
        return VisitResponse.from(visitService.checkIn(id, location));
    }

    @PostMapping("/{id}/check-out")
    public VisitResponse checkOut(@PathVariable Long id,
            @RequestBody(required = false) EvidenceRequest evidence) {
        return VisitResponse.from(visitService.checkOut(id, evidence));
    }

    @PostMapping("/{id}/evidence")
    public VisitResponse supplyEvidence(@PathVariable Long id,
            @RequestBody(required = false) EvidenceRequest evidence) {
        return VisitResponse.from(visitService.supplyEvidence(id, evidence));
    }

    @PostMapping("/{id}/claim")
    public VisitResponse submitClaim(@PathVariable Long id) {
        return VisitResponse.from(visitService.submitClaim(id));
    }

    @PutMapping("/{id}")
    public VisitResponse reschedule(@PathVariable Long id,
            @RequestBody(required = false) RescheduleRequest request) {
        return VisitResponse.from(visitService.reschedule(id, request));
    }

    // HTTP DELETE is the cancel verb. The row stays; status becomes CANCELLED.
    @DeleteMapping("/{id}")
    public VisitResponse cancel(@PathVariable Long id) {
        return VisitResponse.from(visitService.cancel(id));
    }
}
