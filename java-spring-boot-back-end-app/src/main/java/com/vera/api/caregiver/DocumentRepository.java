package com.vera.api.caregiver;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    // Scoped to the caregiver in the path. A bare findById would let
    // /caregivers/1/documents/19 act on caregiver 5's record.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from Document d where d.id = :id and d.caregiver.id = :caregiverId")
    Optional<Document> findByIdForUpdate(@Param("id") Long id,
            @Param("caregiverId") Long caregiverId);
}
