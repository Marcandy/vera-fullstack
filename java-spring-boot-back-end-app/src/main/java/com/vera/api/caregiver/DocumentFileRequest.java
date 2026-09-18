package com.vera.api.caregiver;

import java.time.Instant;

// Shared by the caregiver sending in a renewal and the office recording a
// document directly. Same payload, different rules, which is why the two verbs
// stay separate in the service rather than sharing a flag.
//
// It carries METADATA ONLY. Nothing here stores the file itself, and the UI
// says so plainly: there is nowhere to put the bytes, and inventing storage
// would be the one dishonest thing in the app.
//
// issuedAt and expiresAt arrive as ISO-8601 from the browser's toISOString(),
// which Jackson binds to Instant without a custom format.
public record DocumentFileRequest(
        String fileName,
        Integer fileSize,
        String fileType,
        Instant issuedAt,
        Instant expiresAt) {
}
