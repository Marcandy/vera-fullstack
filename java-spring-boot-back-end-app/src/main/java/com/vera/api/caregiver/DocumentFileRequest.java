package com.vera.api.caregiver;

import java.time.Instant;

// Shared by the caregiver sending in a renewal and the office recording one.
// Same payload, different rules, which is why the two verbs stay separate.
//
// METADATA ONLY. Nothing stores the file itself and the UI says so.
public record DocumentFileRequest(
        String fileName,
        Integer fileSize,
        String fileType,
        Instant issuedAt,
        Instant expiresAt) {
}
