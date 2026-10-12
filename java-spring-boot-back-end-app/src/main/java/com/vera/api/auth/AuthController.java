package com.vera.api.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfAuthenticationStrategy;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final LoginThrottle throttle;
    private final CsrfAuthenticationStrategy csrfAuthenticationStrategy;
    private final SecurityContextRepository securityContextRepository =
            new HttpSessionSecurityContextRepository();
    private final SecurityContextHolderStrategy securityContextHolderStrategy =
            SecurityContextHolder.getContextHolderStrategy();

    AuthController(AuthenticationManager authenticationManager, LoginThrottle throttle,
            CsrfAuthenticationStrategy csrfAuthenticationStrategy) {
        this.authenticationManager = authenticationManager;
        this.throttle = throttle;
        this.csrfAuthenticationStrategy = csrfAuthenticationStrategy;
    }

    @PostMapping("/login")
    public AuthUserResponse login(@RequestBody(required = false) LoginRequest body,
            HttpServletRequest request, HttpServletResponse response) {
        // TODO 1 Reject a missing body or blank credentials (400). Trim and lowercase
        // the email with Locale.ROOT; keep the password exactly as submitted.
        // TODO 2 Count the attempt with throttle.attempt(email, remote address, now).
        // TODO 3 Authenticate with authenticationManager. Let failures reach the advice.
        // TODO 4 Call throttle.succeeded after authentication succeeds.
        // TODO 5 Change an existing session id, then call
        // csrfAuthenticationStrategy.onAuthentication(authentication, request, response).
        // TODO 6 Create and set a security context, then explicitly save it with
        // securityContextRepository so the next request remains signed in.
        // TODO 7 Set the session's max inactive interval from the principal's role,
        // using seconds: 30 minutes for ADMIN, 8 hours for CAREGIVER.
        // TODO 8 Return AuthUserResponse.from(the authenticated VeraUserDetails).
        throw new UnsupportedOperationException("Sign-in is awaiting implementation");
    }

    // 204 when signed out, so the frontend reads "nobody" without an error.
    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> me(@AuthenticationPrincipal VeraUserDetails user) {
        return user == null
                ? ResponseEntity.noContent().build()
                : ResponseEntity.ok(AuthUserResponse.from(user));
    }
}
