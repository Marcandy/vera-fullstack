package com.vera.api.auth;

public class TooManyAttemptsException extends RuntimeException {

    private final long retryAfterSeconds;

    public TooManyAttemptsException(long retryAfterSeconds) {
        super(message(Math.max(1, (retryAfterSeconds + 59) / 60)));
        this.retryAfterSeconds = retryAfterSeconds;
    }

    private static String message(long minutes) {
        return "Too many sign-in attempts. Try again in " + minutes
                + (minutes == 1 ? " minute." : " minutes.");
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
