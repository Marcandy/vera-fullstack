package com.vera.api.patient;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientRepository patients;
    private final PatientService patientService;

    // Constructor injection, no @Autowired needed. The field is final, so the
    // compiler refuses a controller built without its repository.
    PatientController(PatientRepository patients, PatientService patientService) {
        this.patients = patients;
        this.patientService = patientService;
    }

    @GetMapping
    public List<PatientResponse> getPatients() {
        return patients.findAll().stream()
                .map(PatientResponse::from)
                .toList();
    }

    // Missing is 404, never 200 with an empty body: the client renders not-found
    // as an answer and a failed request as a retryable error.
    @GetMapping("/{id}")
    public ResponseEntity<PatientResponse> getPatientById(@PathVariable Long id) {
        return patients.findById(id)
                .map(PatientResponse::from)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PatientResponse> addPatient(@RequestBody CreatePatientRequest request) {
        Patient patient = patientService.addPatient(request);
        return ResponseEntity.created(URI.create("/api/patients/" + patient.getId()))
                .body(PatientResponse.from(patient));
    }
}
