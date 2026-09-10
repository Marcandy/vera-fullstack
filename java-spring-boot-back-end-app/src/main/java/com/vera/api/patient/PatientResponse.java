package com.vera.api.patient;

// The wire shape, deliberately not the entity.
//
// Returning Patient from a controller would hand Jackson a managed object: it
// serialises whatever relations it finds, a lazy one either throws or quietly
// fires a query per row, and every column added later becomes public API the
// day it is added. A record states what the client gets and nothing else.
//
// from() is package-private on purpose. The controller lives in this package,
// so nothing outside the feature needs to build one.
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
