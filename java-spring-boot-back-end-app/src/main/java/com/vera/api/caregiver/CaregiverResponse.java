package com.vera.api.caregiver;

// The wire shape, not the entity. Documents will be their own response when the
// compliance feature lands, never a nested dump of the table.
public record CaregiverResponse(Long id, String name, String phone) {

    static CaregiverResponse from(Caregiver caregiver) {
        return new CaregiverResponse(
                caregiver.getId(),
                caregiver.getName(),
                caregiver.getPhone());
    }
}
