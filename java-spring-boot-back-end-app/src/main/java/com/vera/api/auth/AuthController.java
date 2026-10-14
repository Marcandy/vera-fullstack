package com.vera.api.auth;

import java.time.Instant;
import java.util.Locale;

import com.vera.api.Inputs;
import com.vera.api.InvalidInputException;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
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
        if (body == null) {
            throw new InvalidInputException("Sign-in request is required");
        }

        String email = Inputs.blankToNull(body.email());
        String password = body.password();

        if (email == null) {
            throw new InvalidInputException("Email is required");
        }
        if (password == null || password.isBlank()) {
            throw new InvalidInputException("Password is required");
        }

        email = email.toLowerCase(Locale.ROOT);
        String clientAddress = request.getRemoteAddr();
        throttle.attempt(email, clientAddress, Instant.now());

        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(email, password));
        throttle.succeeded(email, clientAddress);

        if (request.getSession(false) != null) {
            request.changeSessionId();
        }
        csrfAuthenticationStrategy.onAuthentication(authentication, request, response);

        VeraUserDetails user = (VeraUserDetails) authentication.getPrincipal();
        SecurityContext context = securityContextHolderStrategy.createEmptyContext();
        context.setAuthentication(authentication);
        securityContextHolderStrategy.setContext(context);
        securityContextRepository.saveContext(context, request, response);

        request.getSession().setMaxInactiveInterval(
                Math.toIntExact(user.getRole().idleTimeout().toSeconds()));

        return AuthUserResponse.from(user);
    }

    // 204 when signed out, so the frontend reads "nobody" without an error.
    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> me(@AuthenticationPrincipal VeraUserDetails user) {
        return user == null
                ? ResponseEntity.noContent().build()
                : ResponseEntity.ok(AuthUserResponse.from(user));
    }
}
