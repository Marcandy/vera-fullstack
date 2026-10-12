package com.vera.api.auth;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

// Counts sign-in attempts in memory, so it only holds for a single instance.
// Keyed by email and client address together, so a stranger cannot lock Marcus
// out from somewhere else; the looser per-email cap slows stuffing spread across
// many addresses.
@Component
public class LoginThrottle {

    static final int MAX_ATTEMPTS_PER_CLIENT = 5;
    static final int MAX_ATTEMPTS_PER_EMAIL = 20;
    static final Duration WINDOW = Duration.ofMinutes(15);

    private static final int MAX_KEYS = 10_000;

    private final Map<String, Window> attempts = new HashMap<>();

    // Counts the attempt BEFORE the password is checked. Counting failures
    // afterwards lets a burst of parallel requests all pass the check first.
    public synchronized void attempt(String email, String clientAddress, Instant now) {
        String clientKey = clientKey(email, clientAddress);
        String emailKey = emailKey(email);
        int newKeys = (attempts.containsKey(clientKey) ? 0 : 1)
                + (attempts.containsKey(emailKey) ? 0 : 1);
        if (attempts.size() + newKeys > MAX_KEYS) {
            attempts.values().removeIf(window -> window.expired(now));
            newKeys = (attempts.containsKey(clientKey) ? 0 : 1)
                    + (attempts.containsKey(emailKey) ? 0 : 1);
            if (attempts.size() + newKeys > MAX_KEYS) {
                long retryAfter = attempts.values().stream()
                        .mapToLong(window -> secondsRemaining(window, now))
                        .min().orElse(1);
                throw new TooManyAttemptsException(retryAfter);
            }
        }
        long retryAfter = Math.max(
                count(clientKey, MAX_ATTEMPTS_PER_CLIENT, now),
                count(emailKey, MAX_ATTEMPTS_PER_EMAIL, now));
        if (retryAfter > 0) {
            throw new TooManyAttemptsException(retryAfter);
        }
    }

    // A good password clears this client and gives back the one attempt it
    // added to the email's count, so the owner signing in never locks themselves.
    public synchronized void succeeded(String email, String clientAddress) {
        attempts.remove(clientKey(email, clientAddress));
        attempts.computeIfPresent(emailKey(email), (key, window) -> window.count() <= 1
                ? null
                : new Window(window.start(), window.count() - 1));
    }

    // Seconds until the window resets when this attempt is over the limit, else 0.
    private long count(String key, int limit, Instant now) {
        Window window = attempts.compute(key, (k, current) -> current == null
                ? new Window(now, 1)
                : current.next(now));
        if (window.count() <= limit) {
            return 0;
        }
        return secondsRemaining(window, now);
    }

    private static long secondsRemaining(Window window, Instant now) {
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
            return expired(now) ? new Window(now, 1)
                    : new Window(start, Math.min(count + 1, MAX_ATTEMPTS_PER_EMAIL + 1));
        }
    }
}
