package com.vera.api.auth;

import java.util.List;

import com.vera.api.user.UserAccountRepository;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

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
}
