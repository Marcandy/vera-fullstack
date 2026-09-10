package com.vera.api.visit;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
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

    @GetMapping
    public List<VisitResponse> getVisits() {
        return visits.findAllWithPeople().stream()
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
