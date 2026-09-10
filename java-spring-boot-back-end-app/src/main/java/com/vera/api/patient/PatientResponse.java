package com.vera.api.patient;

// The wire shape, not the entity. Returning Patient would serialise whatever
// relations it has and make every new column public API the day it is added.
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
