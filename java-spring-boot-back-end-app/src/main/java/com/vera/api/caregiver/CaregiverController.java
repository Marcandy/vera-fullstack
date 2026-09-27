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

    @PostMapping
    public ResponseEntity<CaregiverResponse> add(
            @RequestBody(required = false) CreateCaregiverRequest request) {
        Caregiver caregiver = caregiverService.add(request);
        return ResponseEntity.created(URI.create("/api/caregivers/" + caregiver.getId()))
                .body(CaregiverResponse.from(caregiver));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        caregiverService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
