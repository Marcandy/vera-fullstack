package com.vera.api.visit;

// Pipeline position, named for the event that produced it. Declared in the order
// a visit moves through, which the client's own status list mirrors.
public enum VisitStatus {
    SCHEDULED,
    IN_PROGRESS,
    NEEDS_REVIEW,
    READY_TO_BILL,
    BILLED
}
