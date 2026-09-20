package com.vera.api.caregiver;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    // Scoped to the caregiver in the path. A bare findById would let
    // /caregivers/1/documents/19 act on caregiver 5's record.
    Optional<Document> findByIdAndCaregiver_Id(Long id, Long caregiverId);
}
