package com.vera.api.claim;

import java.math.BigDecimal;
import java.time.Instant;

import com.vera.api.visit.Visit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "claims")
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "visit_id", nullable = false, unique = true, updatable = false)
    private Visit visit;

    @Column(nullable = false, unique = true, length = 40, updatable = false)
    private String reference;

    @Column(nullable = false, precision = 10, scale = 2, updatable = false)
    private BigDecimal amount;

    @Column(nullable = false, updatable = false)
    private Instant submittedAt;

    protected Claim() {
    }

    public Claim(Visit visit, String reference, BigDecimal amount, Instant submittedAt) {
        this.visit = visit;
        this.reference = reference;
        this.amount = amount;
        this.submittedAt = submittedAt;
    }

    public Long getId() {
        return id;
    }

    public Visit getVisit() {
        return visit;
    }

    public String getReference() {
        return reference;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }
}
