package com.vera.api.caregiver;

import static com.vera.api.Inputs.blankToNull;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import com.vera.api.IllegalTransitionException;
import com.vera.api.InvalidInputException;
import com.vera.api.NotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DocumentService {

    // Must match RENEWAL_WINDOW_DAYS in src/utils/documents.js.
    private static final long RENEWAL_WINDOW_DAYS = 30;

    private final CaregiverRepository caregivers;
    private final DocumentRepository documents;

    DocumentService(CaregiverRepository caregivers, DocumentRepository documents) {
        this.caregivers = caregivers;
        this.documents = documents;
    }

    // Java twin of documentStatus() in src/utils/documents.js.
    static DocumentStatus statusOf(Document document, Instant now) {
        boolean received = document.getSignature() != null || document.getFileName() != null;

        if (!received) return DocumentStatus.PENDING;

        Instant expiresAt = document.getExpiresAt();
        if (expiresAt == null) return DocumentStatus.SIGNED;

        if (!expiresAt.isAfter(now)) return DocumentStatus.EXPIRED;
        if (!expiresAt.isAfter(now.plus(RENEWAL_WINDOW_DAYS, ChronoUnit.DAYS))) {
            return DocumentStatus.EXPIRING;
        }

        return DocumentStatus.SIGNED;
    }

    // Server clock: a caller-chosen instant could make a lapsed card look signable.
    @Transactional
    public Caregiver sign(Long caregiverId, Long documentId, SignatureRequest request) {
        if (request == null) {
            throw new InvalidInputException("Signature request is required");
        }

        Document document = load(caregiverId, documentId);

        Instant now = Instant.now();
        DocumentStatus status = statusOf(document, now);

        if (status != DocumentStatus.PENDING) {
            throw new IllegalTransitionException(
                    status == DocumentStatus.EXPIRED
                            ? "This document has expired. Signing does not renew it; record the new one instead."
                            : "Cannot sign a document that is " + status.label());
        }

        String signature = blankToNull(request.signature());
        if (signature == null) {
            throw new InvalidInputException("Signature is required");
        }

        document.setSignature(signature);
        document.setReceivedAt(now);

        return reload(caregiverId);
    }

    // Accepts any state: this is the only exit from EXPIRED.
    @Transactional
    public Caregiver recordFile(Long caregiverId, Long documentId, DocumentFileRequest request) {
        if (request == null) {
            throw new InvalidInputException("Document request is required");
        }

        Document document = load(caregiverId, documentId);

        String fileName = blankToNull(request.fileName());
        if (fileName == null) {
            throw new InvalidInputException("Choose a file to record");
        }

        Instant now = Instant.now();
        Instant expiresAt = request.expiresAt();

        requireFutureExpiry(expiresAt, now,
                "That expiry date has already passed; record a current document");

        document.setFileName(fileName);
        document.setFileSize(request.fileSize());
        document.setFileType(request.fileType());
        document.setIssuedAt(request.issuedAt());
        document.setExpiresAt(expiresAt);
        document.setReceivedAt(now);

        // Recording SUPERSEDES anything pending, or accepting it later would
        // overwrite this newer credential with the one it replaced.
        document.clearPendingSubmission();

        return reload(caregiverId);
    }

    // Waits beside the live document until the office accepts it: a credential
    // that cleared itself is one nobody checked.
    @Transactional
    public Caregiver submitRenewal(Long caregiverId, Long documentId, DocumentFileRequest request) {
        if (request == null) {
            throw new InvalidInputException("Document request is required");
        }

        Document document = load(caregiverId, documentId);

        String fileName = blankToNull(request.fileName());
        if (fileName == null) {
            throw new InvalidInputException("Choose a file to send in");
        }

        Instant now = Instant.now();
        Instant expiresAt = request.expiresAt();

        requireFutureExpiry(expiresAt, now,
                "That expiry date has already passed; send in a current document");

        document.setPendingFileName(fileName);
        document.setPendingFileSize(request.fileSize());
        document.setPendingFileType(request.fileType());
        document.setPendingIssuedAt(request.issuedAt());
        document.setPendingExpiresAt(expiresAt);

        // DocumentResponse keys `submission` off this field, so a renewal
        // without it is invisible to the frontend.
        document.setPendingSubmittedAt(now);

        return reload(caregiverId);
    }

    @Transactional
    public Caregiver acceptSubmission(Long caregiverId, Long documentId) {
        Document document = load(caregiverId, documentId);

        Instant submittedAt = document.getPendingSubmittedAt();

        if (submittedAt == null) {
            throw new IllegalTransitionException(
                    "There is nothing waiting to be accepted on this document");
        }

        // Read the pending values before the slot is cleared below.
        document.setFileName(document.getPendingFileName());
        document.setFileSize(document.getPendingFileSize());
        document.setFileType(document.getPendingFileType());
        document.setIssuedAt(document.getPendingIssuedAt());
        document.setExpiresAt(document.getPendingExpiresAt());

        // When the caregiver sent it, not when the office checked it.
        document.setReceivedAt(submittedAt);

        // The old signature attested to the document this one replaces.
        document.setSignature(null);
        document.clearPendingSubmission();

        return reload(caregiverId);
    }

    private Document load(Long caregiverId, Long documentId) {
        return documents.findByIdAndCaregiver_Id(documentId, caregiverId)
                .orElseThrow(() -> new NotFoundException(
                        "Document " + documentId + " not found for caregiver " + caregiverId));
    }

    // open-in-view is false, so reload through the join fetch.
    private Caregiver reload(Long caregiverId) {
        return caregivers.findByIdWithDocuments(caregiverId)
                .orElseThrow(() -> new NotFoundException("Caregiver " + caregiverId + " not found"));
    }

    // An expiry already past would file the document straight into EXPIRED.
    private static void requireFutureExpiry(Instant expiresAt, Instant now, String message) {
        if (expiresAt != null && !expiresAt.isAfter(now)) {
            throw new InvalidInputException(message);
        }
    }
}
