package com.vera.api.auth;

import java.util.List;

import com.vera.api.user.UserAccountRepository;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class SessionAccountFilterTests {
    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticatedFrontendAndProbesNeverRequireTheDatabase() throws Exception {
        var users = mock(UserAccountRepository.class);
        var user = mock(VeraUserDetails.class);
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(user, null, List.of()));
        var filter = new SessionAccountFilter(users, new JsonSecurityErrorHandler());

        for (String path : new String[] {"/", "/dashboard", "/assets/main.js", "/readyz", "/livez"}) {
            var request = new MockHttpServletRequest();
            request.setServletPath(path);
            boolean[] continued = {false};
            filter.doFilter(request, new MockHttpServletResponse(), (req, res) -> continued[0] = true);
            assertTrue(continued[0], path + " must be served even while account storage is unavailable");
        }
        verifyNoInteractions(users);
    }

    @Test
    void unavailableAccountStorageReturnsUncached503AndPreservesAuthentication() throws Exception {
        var users = mock(UserAccountRepository.class);
        var user = mock(VeraUserDetails.class);
        when(user.getId()).thenReturn(7L);
        when(users.findSessionAccountById(7L)).thenThrow(new DataAccessResourceFailureException("offline"));
        var authentication = UsernamePasswordAuthenticationToken.authenticated(user, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        var request = new MockHttpServletRequest();
        request.setServletPath("/api/auth/me");
        var response = new MockHttpServletResponse();
        boolean[] continued = {false};

        new SessionAccountFilter(users, new JsonSecurityErrorHandler()).doFilter(request, response,
                (req, res) -> continued[0] = true);

        assertFalse(continued[0]);
        assertEquals(503, response.getStatus());
        assertEquals("no-store", response.getHeader("Cache-Control"));
        assertSame(authentication, SecurityContextHolder.getContext().getAuthentication());
    }
}
