package com.vera.api.patient;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "patients")
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String address;
    private String phone;

    @Column(length = 2000)
    private String standingConcerns;

    protected Patient() {
    }

    public Patient(String name, String address, String phone, String standingConcerns) {
        this.name = name;
        this.address = address;
        this.phone = phone;
        this.standingConcerns = standingConcerns;
    }

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
