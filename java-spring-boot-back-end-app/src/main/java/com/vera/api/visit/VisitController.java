package com.vera.api.visit;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// Reads only. Check in, check out and scheduling are writes that need the
// domain service holding the evidence rule, so they are not here yet.
@RestController
@RequestMapping("/api/visits")
public class VisitController {

    private final VisitRepository visits;

    VisitController(VisitRepository visits) {
        this.visits = visits;
    }

    // Every parameter is optional, and an absent one means no restriction, so the
    // callers that want the whole collection still ask for GET /api/visits with
    // nothing on it. This mirrors getVisits in the React service layer, which was
    // already written to this signature.
    //
    // Spring binds the enum through Enum.valueOf, which is why the frontend
    // constants were changed to match these names rather than carrying labels.
    @GetMapping
    public List<VisitResponse> getVisits(
            @RequestParam(required = false) VisitStatus status,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long caregiverId,
            @RequestParam(required = false) Long patientId) {

        // Blank means no search rather than a match against the empty string.
        // ?q= arrives as an empty string and ?q=%20 as a space, and folding both
        // to null here keeps that decision in one place instead of teaching the
        // query about whitespace.
        String search = StringUtils.hasText(q) ? q.trim() : null;

        // The filtering belongs in the query, not in a .filter() over the result.
        // Sifting fourteen rows in memory works and is the wrong shape: once the
        // table is bigger than one response, the rows that would have matched are
        // the ones that were never loaded.
        return visits.search(status, search, caregiverId, patientId).stream()
                .map(VisitResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<VisitResponse> getVisitById(@PathVariable Long id) {
        return visits.findByIdWithPeople(id)
                .map(VisitResponse::from)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
