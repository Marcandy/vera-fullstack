package com.vera.api.patient;

public record PatientResponse(
        Long id,
        String name,
        String phone,
        String address,
        String standingConcerns) {

    static PatientResponse from(Patient patient) {
        return new PatientResponse(
                patient.getId(),
                patient.getName(),
                patient.getPhone(),
                patient.getAddress(),
                patient.getStandingConcerns());
    }
}
