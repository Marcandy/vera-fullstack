package com.vera.api;

public final class Inputs {

    private Inputs() {
    }

    // Null, not "": the client reads null as missing, and SQL NULL keeps every
    // missing check to one comparison.
    public static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
