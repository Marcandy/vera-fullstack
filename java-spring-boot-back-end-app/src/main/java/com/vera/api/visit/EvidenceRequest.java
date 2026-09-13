package com.vera.api.visit;

// Named for the payload, not the endpoint, because #20's POST /evidence carries
// the same two fields. The MERGE POLICY is what differs and it lives in the
// service: check-out stores a blank as null, supplying evidence keeps what is
// already there.
public record EvidenceRequest(String assessment, String signature) {
}
