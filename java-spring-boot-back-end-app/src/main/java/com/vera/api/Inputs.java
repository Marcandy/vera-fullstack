package com.vera.api;

// Normalizing values that arrived in a request body. Four services were doing
// this identically. Static and final because it has no state and no
// collaborators: a Spring bean would buy a constructor parameter and nothing
// else.
public final class Inputs {

    private Inputs() {
    }

    // Empty is not evidence, and the client reads null to mean missing. Null
    // rather than "" also lands the column as SQL NULL, so every check for a
    // missing value is one comparison instead of two.
    public static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
