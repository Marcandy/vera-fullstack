package com.vera.api.auth;

import java.util.Locale;

import com.vera.api.user.UserAccountRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class VeraUserDetailsService implements UserDetailsService {

    private final UserAccountRepository users;

    VeraUserDetailsService(UserAccountRepository users) {
        this.users = users;
    }

    // DaoAuthenticationProvider turns this into BadCredentialsException, so an
    // unknown email and a wrong password look the same to the caller.
    @Override
    public UserDetails loadUserByUsername(String email) {
        String normalized = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        return users.findByEmailWithCaregiver(normalized)
                .map(VeraUserDetails::from)
                .orElseThrow(() -> new UsernameNotFoundException("No user for that email"));
    }
}
