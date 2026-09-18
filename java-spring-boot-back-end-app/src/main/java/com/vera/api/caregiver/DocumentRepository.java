package com.vera.api.caregiver;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    // Scoped to the caregiver in the path rather than looked up by document id
    // alone. A bare findById would let POST /caregivers/1/documents/19/signature
    // sign caregiver 5's lapsed card, because the id in the path would be
    // decoration instead of identity. A mismatch comes back empty, which the
    // service turns into a 404.
    Optional<Document> findByIdAndCaregiver_Id(Long id, Long caregiverId);
}
