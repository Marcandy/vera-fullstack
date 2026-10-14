package com.vera.api.auth;

import java.util.Collection;
import java.util.List;

import com.vera.api.user.Role;
import com.vera.api.user.UserAccount;

import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

// The principal kept in the session. A snapshot, not the entity: it is serialized
// with the session, and a lazy proxy would not survive that.
public class VeraUserDetails implements UserDetails, CredentialsContainer {

    private final Long id;
    private final String email;
    private String passwordHash;
    private final String name;
    private final Role role;
    private final Long caregiverId;
    private final boolean enabled;

    private VeraUserDetails(UserAccount account) {
        this.id = account.getId();
        this.email = account.getEmail();
        this.passwordHash = account.getPasswordHash();
        this.name = account.getName();
        this.role = account.getRole();
        this.caregiverId = account.getCaregiver() == null ? null : account.getCaregiver().getId();
        this.enabled = account.isEnabled();
    }

    static VeraUserDetails from(UserAccount account) {
        return new VeraUserDetails(account);
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Role getRole() {
        return role;
    }

    public Long getCaregiverId() {
        return caregiverId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    // ProviderManager calls this after a successful sign-in, so the hash never
    // sits in the session.
    @Override
    public void eraseCredentials() {
        passwordHash = null;
    }
}
