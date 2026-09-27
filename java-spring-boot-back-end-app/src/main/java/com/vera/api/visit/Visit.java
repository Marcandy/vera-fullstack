package com.vera.api.visit;

import java.math.BigDecimal;
import java.time.Instant;

import com.vera.api.caregiver.Caregiver;
import com.vera.api.claim.Claim;
import com.vera.api.patient.Patient;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "visits")
public class Visit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caregiver_id")
    private Caregiver caregiver;

    @Column(nullable = false)
    private Instant appointmentTime;

    // VARCHAR, not a MySQL ENUM, so adding a status is not an ALTER TABLE.
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private VisitStatus status;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private ServiceType serviceType;

    @Column(precision = 10, scale = 2)
    private BigDecimal estimatedCost;

    @OneToOne(mappedBy = "visit", fetch = FetchType.LAZY)
    private Claim claim;

    // Evidence. Null means not captured; what is missing is derived, never stored.
    private Instant checkInTime;
    private Instant checkOutTime;

    // Metadata, never evidence. Boxed: 0.0 and never captured are different facts.
    private Double checkInLatitude;
    private Double checkInLongitude;
    private Double checkInAccuracy;

    // Why there are no coordinates: denied, unavailable, timeout, unsupported.
    private String checkInLocationReason;

    @Column(length = 2000)
    private String assessment;

    private String signature;

    // Raised on this visit. Not evidence, so it never blocks billing.
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

    public Claim getClaim() {
        return claim;
    }

    public void setClaim(Claim claim) {
        this.claim = claim;
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

    public Double getCheckInLatitude() {
        return checkInLatitude;
    }

    public void setCheckInLatitude(Double checkInLatitude) {
        this.checkInLatitude = checkInLatitude;
    }

    public Double getCheckInLongitude() {
        return checkInLongitude;
    }

    public void setCheckInLongitude(Double checkInLongitude) {
        this.checkInLongitude = checkInLongitude;
    }

    public Double getCheckInAccuracy() {
        return checkInAccuracy;
    }

    public void setCheckInAccuracy(Double checkInAccuracy) {
        this.checkInAccuracy = checkInAccuracy;
    }

    public String getCheckInLocationReason() {
        return checkInLocationReason;
    }

    public void setCheckInLocationReason(String checkInLocationReason) {
        this.checkInLocationReason = checkInLocationReason;
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
