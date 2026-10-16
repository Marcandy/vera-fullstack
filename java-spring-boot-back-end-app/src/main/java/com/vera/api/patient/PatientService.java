package com.vera.api.patient;

import static com.vera.api.Inputs.blankToNull;

import java.util.List;

import com.vera.api.InvalidInputException;
import com.vera.api.NotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;

@Service
@PreAuthorize("hasRole('ADMIN')")
public class PatientService {

    private final PatientRepository patients;

    PatientService(PatientRepository patients) {
        this.patients = patients;
    }

    @Transactional(readOnly = true)
    public List<Patient> findAll() {
        return patients.findAll();
    }

    @Transactional(readOnly = true)
    public Patient findById(Long id) {
        return patients.findById(id)
                .orElseThrow(() -> new NotFoundException("Record not found"));
    }

    @Transactional
    public Patient addPatient(CreatePatientRequest request) {
        if (request == null) {
            throw new InvalidInputException("Patient request is required");
        }
        String name = blankToNull(request.name());
        String address = blankToNull(request.address());
        String phone = blankToNull(request.phone());
        String standingConcerns = blankToNull(request.standingConcerns());

        if (name == null) {
            throw new InvalidInputException("Patient name is required");
        }
        if (address == null) {
            throw new InvalidInputException("Patient address is required");
        }
        validateLength(name, 255, "Patient name");
        validateLength(address, 255, "Patient address");
        validateLength(phone, 255, "Patient phone");
        validateLength(standingConcerns, 2000, "Patient standing concerns");

        Patient patient = new Patient(name, address, phone, standingConcerns);
        return patients.save(patient);
    }

    private static void validateLength(String value, int maxLength, String field) {
        if (value != null && value.length() > maxLength) {
            throw new InvalidInputException(field + " must not exceed " + maxLength + " characters");
        }
    }
}
