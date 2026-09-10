package com.vera.api.caregiver;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Reads only. Adding a caregiver creates their document checklist, which is the
// compliance feature's job.
@RestController
@RequestMapping("/api/caregivers")
public class CaregiverController {

    private final CaregiverRepository caregivers;

    CaregiverController(CaregiverRepository caregivers) {
        this.caregivers = caregivers;
    }

    @GetMapping
    public List<CaregiverResponse> getCaregivers() {
        return caregivers.findAll().stream()
                .map(CaregiverResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CaregiverResponse> getCaregiverById(@PathVariable Long id) {
        return caregivers.findById(id)
                .map(CaregiverResponse::from)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
