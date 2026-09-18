package com.vera.api.caregiver;

// The caregiver typing their own name. There is no date here on purpose: the
// server stamps when a signature arrived, the same rule check-in follows.
public record SignatureRequest(String signature) {
}
