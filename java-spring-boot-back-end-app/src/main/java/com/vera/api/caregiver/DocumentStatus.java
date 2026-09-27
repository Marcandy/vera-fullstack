package com.vera.api.caregiver;

// Derived, never a column. Names match DOCUMENT_STATUS in src/utils/status.js.
public enum DocumentStatus {
    PENDING("pending"),
    SIGNED("signed"),
    EXPIRING("expiring"),
    EXPIRED("expired");

    private final String label;

    DocumentStatus(String label) {
        this.label = label;
    }

    // Refusal messages only, lowercase because they are read mid sentence.
    public String label() {
        return this.label;
    }
}
