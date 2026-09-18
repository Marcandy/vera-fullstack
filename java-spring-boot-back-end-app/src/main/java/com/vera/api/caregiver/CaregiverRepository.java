package com.vera.api.caregiver;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CaregiverRepository extends JpaRepository<Caregiver, Long> {

    // distinct: join fetch of a one-to-many duplicates the parent per document.
    @Query("select distinct c from Caregiver c left join fetch c.documents")
    List<Caregiver> findAllWithDocuments();

    @Query("select distinct c from Caregiver c left join fetch c.documents where c.id = :id")
    Optional<Caregiver> findByIdWithDocuments(@Param("id") Long id);
}
