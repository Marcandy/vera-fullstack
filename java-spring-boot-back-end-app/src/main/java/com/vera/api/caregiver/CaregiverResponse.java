package com.vera.api.caregiver;

import java.util.List;

public record CaregiverResponse(
        Long id,
        String name,
        String phone,
        List<DocumentResponse> documents) {

    static CaregiverResponse from(Caregiver caregiver) {
        return new CaregiverResponse(
                caregiver.getId(),
                caregiver.getName(),
                caregiver.getPhone(),
                caregiver.getDocuments().stream()
                        .map(DocumentResponse::from)
                        .toList());
    }
}
