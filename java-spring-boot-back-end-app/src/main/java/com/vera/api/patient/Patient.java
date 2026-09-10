package com.vera.api.patient;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// Named explicitly rather than left to Hibernate's naming strategy, which would
// derive "patient" from the class. The strategy is configuration, so a version
// or a setting could rename every table without a code change touching them.
@Entity
@Table(name = "patients")
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String address;
    private String phone;

    // What this patient needs help with in general, true across every visit.
    // Not the same field as a visit's patientConcern, which is what the patient
    // raised on that one day. Longer than a default varchar(255) allows.
    @Column(length = 2000)
    private String standingConcerns;


    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPhone() {
        return phone;
    }

    public String getStandingConcerns() {
        return standingConcerns;
    }

    public void setStandingConcerns(String standingConcerns) {
        this.standingConcerns = standingConcerns;
    }
}
