package com.vera.api.visit;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VisitRepository extends JpaRepository<Visit, Long> {

    // join fetch loads the two relations in the same query. Plain findAll()
    // returns proxies that throw once the session closes, which is the bug this
    // replaces, and open-in-view would have hidden as a query per row instead.
    //
    // Every filter is optional and a null one means no restriction, so a caller
    // that wants the whole collection passes four nulls. One query with guards
    // rather than a derived method name per combination, and rather than a
    // Specification: the filter set is fixed and small, and a Specification
    // would have to strip its own join fetch off any count query it builds.
    //
    // The search matches names only. The assessment is a caregiver's clinical
    // note, and making it searchable is a different feature and a privacy
    // decision nobody has made.
    @Query("""
            select v from Visit v
            join fetch v.patient p
            join fetch v.caregiver c
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

    @Query("select v from Visit v join fetch v.patient join fetch v.caregiver where v.id = :id")
    Optional<Visit> findByIdWithPeople(@Param("id") Long id);

    // One group by rather than a count query per status, and rather than loading
    // every row to count it in Java. The chips need five numbers, not fourteen
    // visits.
    //
    // A status with no visits produces no row, which is correct rather than a
    // gap: the chip renders `?? 0`, and padding the map here would be the server
    // asserting the absence of something instead of simply not counting it.
    @Query("select v.status as status, count(v) as count from Visit v group by v.status")
    List<StatusCount> countByStatus();

    // A projection interface, not the entity and not Object[]. Spring Data reads
    // the getters against the aliases above, so the fold in the controller needs
    // no cast.
    interface StatusCount {
        VisitStatus getStatus();

        long getCount();
    }
}
