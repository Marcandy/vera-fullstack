package com.vera.api.visit;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VisitRepository extends JpaRepository<Visit, Long> {

    // join fetch because open-in-view is false. A null filter means no restriction.
    // Names only: making clinical notes searchable is a privacy decision.
    @Query("""
            select v from Visit v
            join fetch v.patient p
            join fetch v.caregiver c
            left join fetch v.claim
            where (:status is null or v.status = :status)
              and (:caregiverId is null or c.id = :caregiverId)
              and (:patientId is null or p.id = :patientId)
              and (:q is null or lower(p.name) like lower(concat('%', :q, '%'))
                              or lower(c.name) like lower(concat('%', :q, '%')))
            """)
    List<Visit> search(@Param("status") VisitStatus status,
            @Param("q") String q,
            @Param("caregiverId") Long caregiverId,
            @Param("patientId") Long patientId);

    @Query("select v from Visit v join fetch v.patient join fetch v.caregiver left join fetch v.claim where v.id = :id")
    Optional<Visit> findByIdWithPeople(@Param("id") Long id);

    // Serialize claim submissions on the visit before checking its status.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from Visit v where v.id = :id")
    Optional<Visit> findByIdForUpdate(@Param("id") Long id);

    // A status with no visits has no row; the client renders `?? 0`.
    @Query("select v.status as status, count(v) as count from Visit v group by v.status")
    List<StatusCount> countByStatus();

    boolean existsByCaregiver_Id(Long caregiverId);

    interface StatusCount {
        VisitStatus getStatus();

        long getCount();
    }
}
