package com.vera.api.visit;

// Declared in pipeline order; the client's status list mirrors it.
public enum VisitStatus {
    SCHEDULED("scheduled"),
    IN_PROGRESS("in progress"),
    NEEDS_REVIEW("needs review"),
    READY_TO_BILL("ready to bill"),
    BILLED("billed"),
    // Exit, not a pipeline step: a scheduled visit that will not happen.
    CANCELLED("cancelled");

    private final String label;

    VisitStatus(String label) {
        this.label = label;
    }

    // Lowercase because refusal messages read it mid sentence. Not getLabel(), so it
    // never becomes a JSON property.
    public String label() {
        return this.label;
    }
}
