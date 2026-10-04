package com.vera.api.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

// Counts failed sign-ins in memory, so it only holds for a single instance.
// Keyed by email and client address together, so a stranger cannot lock Marcus
// out from somewhere else; the looser per-email cap slows stuffing spread across
// many addresses.
@Component
public class LoginThrottle {

    static final int MAX_FAILURES_PER_CLIENT = 5;
    static final int MAX_FAILURES_PER_EMAIL = 20;
    static final Duration WINDOW = Duration.ofMinutes(15);

    // Sprayed random emails would otherwise grow the map without bound.
    private static final int PRUNE_ABOVE = 10_000;

    private final Map<String, Window> failures = new ConcurrentHashMap<>();

    public void check(String email, String clientAddress, Instant now) {
        long retryAfter = Math.max(
                secondsBlocked(clientKey(email, clientAddress), MAX_FAILURES_PER_CLIENT, now),
                secondsBlocked(emailKey(email), MAX_FAILURES_PER_EMAIL, now));
        if (retryAfter > 0) {
            throw new TooManyAttemptsException(retryAfter);
        }
    }

    public void recordFailure(String email, String clientAddress, Instant now) {
        if (failures.size() > PRUNE_ABOVE) {
            failures.values().removeIf(window -> window.expired(now));
        }
        Window first = new Window(now, 1);
        failures.merge(clientKey(email, clientAddress), first, (current, ignored) -> current.next(now));
        failures.merge(emailKey(email), first, (current, ignored) -> current.next(now));
    }

    // Only the client's own count: a success here says nothing about attempts
    // on the same email from elsewhere.
    public void recordSuccess(String email, String clientAddress) {
        failures.remove(clientKey(email, clientAddress));
    }

    private long secondsBlocked(String key, int limit, Instant now) {
        Window window = failures.get(key);
        if (window == null || window.expired(now) || window.count() < limit) {
            return 0;
        }
        return Math.max(1, Duration.between(now, window.start().plus(WINDOW)).toSeconds());
    }

    private static String clientKey(String email, String clientAddress) {
        return "client:" + email + "|" + clientAddress;
    }

    private static String emailKey(String email) {
        return "email:" + email;
    }

    private record Window(Instant start, int count) {

        boolean expired(Instant now) {
            return !now.isBefore(start.plus(WINDOW));
        }

        Window next(Instant now) {
            return expired(now) ? new Window(now, 1) : new Window(start, count + 1);
        }
    }
}
