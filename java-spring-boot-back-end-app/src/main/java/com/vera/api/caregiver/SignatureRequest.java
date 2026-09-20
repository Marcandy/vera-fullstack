package com.vera.api.caregiver;

// No date here on purpose: the server stamps when a signature arrived.
public record SignatureRequest(String signature) {
}
