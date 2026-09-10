package com.vera.api.visit;

import java.math.BigDecimal;
import java.time.Instant;

import com.vera.api.caregiver.Caregiver;
import com.vera.api.patient.Patient;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "visits")
public class Visit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // LAZY so loading a visit does not drag two more rows along. The cost is that
    // reading patient outside a session throws, which a join fetch is the fix for.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caregiver_id")
    private Caregiver caregiver;

    @Column(nullable = false)
    private Instant appointmentTime;

    // STRING, never ORDINAL: ordinal stores declaration order, so reordering the
    // constants silently rewrites every row already in the table.
    @Enumerated(EnumType.STRING)
    private VisitStatus status;

    @Enumerated(EnumType.STRING)
    private ServiceType serviceType;

    // BigDecimal because double cannot represent 0.10 exactly, and a billing
    // record that rounds differently than the payer loses the argument.
    @Column(precision = 10, scale = 2)
    private BigDecimal estimatedCost;

    // The four evidence fields. Null means not captured, and what a visit is
    // missing is derived from these nulls when it is read, never stored.
    private Instant checkInTime;
    private Instant checkOutTime;

    @Column(length = 2000)
    private String assessment;

    private String signature;

    // What the patient raised on this one visit. Not evidence, so it never blocks
    // billing, and not the patient's standing concerns either.
    @Column(length = 2000)
    private String patientConcern;

    public Long getId() {
        return id;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }

    public Caregiver getCaregiver() {
        return caregiver;
    }

    public void setCaregiver(Caregiver caregiver) {
        this.caregiver = caregiver;
    }

    public Instant getAppointmentTime() {
        return appointmentTime;
    }

    public void setAppointmentTime(Instant appointmentTime) {
        this.appointmentTime = appointmentTime;
    }

    public VisitStatus getStatus() {
        return status;
    }

    public void setStatus(VisitStatus status) {
        this.status = status;
    }

    public ServiceType getServiceType() {
        return serviceType;
    }

    public void setServiceType(ServiceType serviceType) {
        this.serviceType = serviceType;
    }

    public BigDecimal getEstimatedCost() {
        return estimatedCost;
    }

    public void setEstimatedCost(BigDecimal estimatedCost) {
        this.estimatedCost = estimatedCost;
    }

    public Instant getCheckInTime() {
        return checkInTime;
    }

    public void setCheckInTime(Instant checkInTime) {
        this.checkInTime = checkInTime;
    }

    public Instant getCheckOutTime() {
        return checkOutTime;
    }

    public void setCheckOutTime(Instant checkOutTime) {
        this.checkOutTime = checkOutTime;
    }

    public String getAssessment() {
        return assessment;
    }

    public void setAssessment(String assessment) {
        this.assessment = assessment;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }

    public String getPatientConcern() {
        return patientConcern;
    }

    public void setPatientConcern(String patientConcern) {
        this.patientConcern = patientConcern;
    }
}
