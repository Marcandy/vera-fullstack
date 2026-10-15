package com.vera.api.auth;

import com.vera.api.NotFoundException;
import com.vera.api.user.Role;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {

    public VeraUserDetails get() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof VeraUserDetails user)) {
            throw new AuthenticationCredentialsNotFoundException("Sign in to continue.");
        }
        return user;
    }

    public boolean isAdmin() {
        return get().getRole() == Role.ADMIN;
    }

    public Long caregiverId() {
        VeraUserDetails user = get();
        if (user.getRole() != Role.CAREGIVER || user.getCaregiverId() == null) {
            throw new AccessDeniedException("A caregiver account is required");
        }
        return user.getCaregiverId();
    }

    public void requireOwnership(Long ownerCaregiverId) {
        // TODO 1: Derive the caller's caregiver id with caregiverId(), never request data.
        // TODO 2: Reject a null owner or a different caregiver id with the generic 404 below.
        // TODO 3: Return normally only for matching ids. Compare Long values, not references.
        // Keep this denying placeholder until the comparison is implemented.
        throw new NotFoundException("Record not found");
    }
}
