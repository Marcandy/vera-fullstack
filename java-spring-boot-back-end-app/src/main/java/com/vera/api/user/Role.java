package com.vera.api.user;

import java.time.Duration;

public enum Role {
    // An office desktop left unattended shows patient data; a caregiver's visit can
    // run hours between check-in and check-out with no request in between.
    ADMIN(Duration.ofMinutes(30)),
    CAREGIVER(Duration.ofHours(8));

    private final Duration idleTimeout;

    Role(Duration idleTimeout) {
        this.idleTimeout = idleTimeout;
    }

    public Duration idleTimeout() {
        return idleTimeout;
    }
}
