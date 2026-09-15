package com.vera.api.patient;

public record CreatePatientRequest(
        String name,
        String address,
        String phone,
        String standingConcerns) {
}
