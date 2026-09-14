package com.vera.api.visit;

// Pipeline position, named for the event that produced it. Declared in the order
// a visit moves through, which the client's own status list mirrors.
public enum VisitStatus {
    SCHEDULED("scheduled"),
    IN_PROGRESS("in progress"),
    NEEDS_REVIEW("needs review"),
    READY_TO_BILL("ready to bill"),
    BILLED("billed");

    private final String label;

    VisitStatus(String label) {
        this.label = label;
    }

    // Refusal messages only, which is why these are lowercase: they are read
    // mid sentence, as "Cannot check in a visit that is billed". The WIRE format
    // stays the constant name, because Spring binds @RequestParam through
    // Enum.valueOf and the frontend constants were changed to match it.
    //
    // Deliberately not named getLabel(): VisitStatus is a Map key in
    // VisitCounts, and having no bean property called label removes any question
    // of it reaching JSON.
    public String label() {
        return this.label;
    }
}
