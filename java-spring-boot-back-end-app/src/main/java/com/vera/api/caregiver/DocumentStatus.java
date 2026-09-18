package com.vera.api.caregiver;

// DERIVED, never a column. A document row records what arrived and when it
// lapses; the status is that plus a clock, so storing it would let the record
// and the badge disagree the moment a date passes.
//
// Declared in the order a credential moves through, the way VisitStatus is.
// The constant names match DOCUMENT_STATUS in src/utils/status.js, so one
// vocabulary runs from here to the status pill.
public enum DocumentStatus {
    PENDING("pending"),
    SIGNED("signed"),
    EXPIRING("expiring"),
    EXPIRED("expired");

    private final String label;

    DocumentStatus(String label) {
        this.label = label;
    }

    // Refusal messages only, lowercase because they are read mid sentence, as
    // "Cannot sign a document that is expiring". Named label() rather than
    // getLabel() for the same reason VisitStatus is: no bean property means no
    // question about it reaching JSON.
    public String label() {
        return this.label;
    }
}
