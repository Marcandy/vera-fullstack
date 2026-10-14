package com.vera.api.auth;

public record LoginRequest(String email, String password) {

    // A record prints every field, so a logged request would print the password.
    @Override
    public String toString() {
        return "LoginRequest[email=" + email + ", password=****]";
    }
}
