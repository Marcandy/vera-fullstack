package com.vera.api.patient;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Reads only. Adding a patient is its own card and needs validation the domain
// owns, so it does not belong here yet.
@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientRepository patients;

    // Constructor injection, and no @Autowired: Spring uses the single
    // constructor on its own. The field is final, so a controller cannot exist
    // without its repository. Field injection cannot promise that, and it also
    // hides the dependency from anyone constructing this in a test.
    PatientController(PatientRepository patients) {
        this.patients = patients;
    }

    @GetMapping
    public List<PatientResponse> getPatients() {
        return patients.findAll().stream()
                .map(PatientResponse::from)
                .toList();
    }

    // A missing record is 404, never 200 with an empty body. The client treats
    // those as different answers: not-found is a result it can render, while a
    // failed request is an error it should offer to retry.
    @GetMapping("/{id}")
    public ResponseEntity<PatientResponse> getPatientById(@PathVariable Long id) {
        return patients.findById(id)
                .map(PatientResponse::from)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
