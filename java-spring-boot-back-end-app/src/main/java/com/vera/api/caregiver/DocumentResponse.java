package com.vera.api.caregiver;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonFormat;

// Nested on CaregiverResponse so a roster row needs no second call. Status is
// not here: the client derives it from these fields plus a clock.
public record DocumentResponse(
        Long id,
        String name,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
        Instant issuedAt,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
        Instant expiresAt,
        String signature,
        String fileName,
        Integer fileSize,
        String fileType,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
        Instant receivedAt,
        Submission submission) {

    public record Submission(
            String fileName,
            Integer fileSize,
            String fileType,
            @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
            Instant issuedAt,
            @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
            Instant expiresAt,
            @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
            Instant submittedAt) {
    }

    static DocumentResponse from(Document document) {
        Submission submission = document.getPendingSubmittedAt() == null
                ? null
                : new Submission(
                        document.getPendingFileName(),
                        document.getPendingFileSize(),
                        document.getPendingFileType(),
                        document.getPendingIssuedAt(),
                        document.getPendingExpiresAt(),
                        document.getPendingSubmittedAt());

        return new DocumentResponse(
                document.getId(),
                document.getName(),
                document.getIssuedAt(),
                document.getExpiresAt(),
                document.getSignature(),
                document.getFileName(),
                document.getFileSize(),
                document.getFileType(),
                document.getReceivedAt(),
                submission);
    }
}
