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
    @Query("select v from Visit v join fetch v.patient join fetch v.caregiver")
    List<Visit> findAllWithPeople();

    @Query("select v from Visit v join fetch v.patient join fetch v.caregiver where v.id = :id")
    Optional<Visit> findByIdWithPeople(@Param("id") Long id);
}
