package com.vera.api.caregiver;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// CaregiverService owns add and delete. GET stays a read through the
// join-fetch queries so a list includes the checklist.
@RestController
@RequestMapping("/api/caregivers")
public class CaregiverController {

    private final CaregiverRepository caregivers;
    private final CaregiverService caregiverService;

    CaregiverController(CaregiverRepository caregivers, CaregiverService caregiverService) {
        this.caregivers = caregivers;
        this.caregiverService = caregiverService;
    }

    @GetMapping
    public List<CaregiverResponse> getCaregivers() {
        return caregivers.findAllWithDocuments().stream()
                .map(CaregiverResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CaregiverResponse> getCaregiverById(@PathVariable Long id) {
        return caregivers.findByIdWithDocuments(id)
                .map(CaregiverResponse::from)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // 201: a caregiver was created. required = false so a missing body is null
    // and the service decides the 400. No rules here.
    @PostMapping
    public ResponseEntity<CaregiverResponse> add(
            @RequestBody(required = false) CreateCaregiverRequest request) {
        Caregiver caregiver = caregiverService.add(request);
        return ResponseEntity.created(URI.create("/api/caregivers/" + caregiver.getId()))
                .body(CaregiverResponse.from(caregiver));
    }

    // 204: the row is gone. 409 if they have visits, decided in the service.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        caregiverService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
