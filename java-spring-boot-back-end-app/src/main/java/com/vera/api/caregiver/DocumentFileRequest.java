package com.vera.api.caregiver;

import java.time.Instant;

// Metadata only. Nothing stores the file itself.
public record DocumentFileRequest(
        String fileName,
        Integer fileSize,
        String fileType,
        Instant issuedAt,
        Instant expiresAt) {
}
