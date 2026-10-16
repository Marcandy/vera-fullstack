package com.vera.api.auth;

import java.io.IOException;
import java.util.Objects;

import com.vera.api.user.Role;
import com.vera.api.user.UserAccountRepository;
import com.vera.api.user.UserAccountRepository.SessionAccount;

import org.springframework.dao.DataAccessException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.CookieClearingLogoutHandler;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// Installed only in the security chain, after the saved context has loaded.
final class SessionAccountFilter extends OncePerRequestFilter {

    private final UserAccountRepository users;
    private final JsonSecurityErrorHandler errors;

    SessionAccountFilter(UserAccountRepository users, JsonSecurityErrorHandler errors) {
        this.users = users;
        this.errors = errors;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        // Static pages and liveness must remain available during a database outage.
        // All account-bearing API reads still revalidate, including /api/auth/me.
        // Signing in can replace an obsolete session; signing out needs no database.
        return !path.startsWith("/api/")
                || path.equals("/api/auth/login") || path.equals("/api/auth/logout");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof VeraUserDetails user) {
            boolean valid;
            try {
                valid = users.findSessionAccountById(user.getId())
                        .filter(account -> matches(account, user))
                        .isPresent();
            } catch (DataAccessException exception) {
                errors.unavailable(response);
                return;
            }

            if (!valid) {
                new SecurityContextLogoutHandler().logout(request, response, authentication);
                new CookieClearingLogoutHandler("JSESSIONID").logout(request, response, authentication);
                errors.commence(request, response,
                        new CredentialsExpiredException("The account's access changed"));
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private static boolean matches(SessionAccount account, VeraUserDetails user) {
        return account.isEnabled()
                && account.getRole() == user.getRole()
                && Objects.equals(account.getCaregiverId(), user.getCaregiverId())
                && (account.getRole() == Role.ADMIN || account.getCaregiverId() != null);
    }
}
