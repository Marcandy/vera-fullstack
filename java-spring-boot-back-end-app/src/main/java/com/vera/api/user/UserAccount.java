package com.vera.api.user;

import com.vera.api.caregiver.Caregiver;

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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

// Not named User: Spring Security ships its own User class, and an IDE will
// happily import the wrong one.
@Entity
@Table(name = "users")
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Stored lowercased and trimmed, so the unique index means one person.
    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false)
    private Role role;

    // Null for an administrator who delivers no care.
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caregiver_id", unique = true)
    private Caregiver caregiver;

    @Column(nullable = false)
    private boolean enabled = true;

    protected UserAccount() {
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getName() {
        return name;
    }

    public Role getRole() {
        return role;
    }

    public Caregiver getCaregiver() {
        return caregiver;
    }

    public boolean isEnabled() {
        return enabled;
    }
}
