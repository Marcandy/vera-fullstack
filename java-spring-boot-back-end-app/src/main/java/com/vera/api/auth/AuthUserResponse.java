package com.vera.api.auth;

import java.util.List;

// The shape the frontend's `user` already has: id, name, email, roles, caregiverId.
public record AuthUserResponse(
        Long id,
        String name,
        String email,
        List<String> roles,
        Long caregiverId
) {

    static AuthUserResponse from(VeraUserDetails user) {
        return new AuthUserResponse(
                user.getId(),
                user.getName(),
                user.getUsername(),
                List.of(user.getRole().name()),
                user.getCaregiverId());
    }
}
