package com.vera.api.auth;

import com.vera.api.user.UserAccountRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import org.springframework.security.web.savedrequest.NullRequestCache;

import jakarta.servlet.DispatcherType;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    // The {bcrypt} prefix selects the encoder for the seeded hashes.
    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(VeraUserDetailsService users,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(users);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }

    @Bean
    CookieCsrfTokenRepository csrfTokenRepository(
            @Value("${server.servlet.session.cookie.secure:false}") boolean secure) {
        CookieCsrfTokenRepository tokens = CookieCsrfTokenRepository.withHttpOnlyFalse();
        tokens.setCookieCustomizer(cookie -> cookie.secure(secure).sameSite("Lax").path("/"));
        return tokens;
    }

    @Bean
    CsrfAuthenticationStrategy csrfAuthenticationStrategy(CookieCsrfTokenRepository tokens) {
        return new CsrfAuthenticationStrategy(tokens);
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
            CookieCsrfTokenRepository tokens, UserAccountRepository users) throws Exception {
        JsonSecurityErrorHandler errors = new JsonSecurityErrorHandler();

        return http
                .addFilterAfter(new SessionAccountFilter(users, errors), SecurityContextHolderFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers(HttpMethod.GET, "/readyz", "/livez").permitAll()
                        .requestMatchers(HttpMethod.GET, "/", "/index.html", "/favicon.svg", "/assets/**",
                                "/about", "/dashboard", "/visits", "/visits/{id}", "/billing",
                                "/caregivers", "/caregivers/{id}", "/patients", "/patients/{id}",
                                "/my-visits", "/my-documents", "/caregiver/visits/{id}").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/me").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/visits/mine").hasRole("CAREGIVER")
                        .requestMatchers(HttpMethod.GET, "/api/visits", "/api/visits/counts",
                                "/api/patients", "/api/patients/{id}", "/api/caregivers").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/visits/{id}", "/api/caregivers/{id}")
                                .hasAnyRole("ADMIN", "CAREGIVER")
                        .requestMatchers(HttpMethod.POST, "/api/visits", "/api/visits/{id}/claim",
                                "/api/patients", "/api/caregivers").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/visits/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/visits/{id}", "/api/caregivers/{id}")
                                .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/visits/{id}/check-in",
                                "/api/visits/{id}/check-out", "/api/visits/{id}/evidence")
                                .hasRole("CAREGIVER")
                        .requestMatchers(HttpMethod.POST,
                                "/api/caregivers/{caregiverId}/documents/{documentId}/signature",
                                "/api/caregivers/{caregiverId}/documents/{documentId}/submission")
                                .hasRole("CAREGIVER")
                        .requestMatchers(HttpMethod.POST,
                                "/api/caregivers/{caregiverId}/documents/{documentId}/file",
                                "/api/caregivers/{caregiverId}/documents/{documentId}/submission/acceptance")
                                .hasRole("ADMIN")
                        .anyRequest().denyAll())
                .csrf(csrf -> csrf.spa().csrfTokenRepository(tokens))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                // The React router remembers links; anonymous API reads need no session.
                .requestCache(cache -> cache.requestCache(new NullRequestCache()))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(errors)
                        .accessDeniedHandler(errors))
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .deleteCookies("JSESSIONID")
                        .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(
                                HttpStatus.NO_CONTENT)))
                .build();
    }
}
