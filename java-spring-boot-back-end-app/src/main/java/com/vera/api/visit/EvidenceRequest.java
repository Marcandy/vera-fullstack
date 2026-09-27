package com.vera.api.visit;

// Shared by check-out and supplying evidence; the merge policy differs, in the service.
public record EvidenceRequest(String assessment, String signature) {
}
