package com.vera.api.caregiver;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import com.vera.api.IllegalTransitionException;
import com.vera.api.InvalidInputException;
import com.vera.api.NotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// The document rules, moved off the client. They ran in caregiverService.js
// until now, which made them suggestions: anything that could reach the API
// could ignore them.
//
// Every verb opens with load() and closes with reload(). open-in-view is false,
// so the checklist has to come back through the join fetch or the controller
// maps a closed session.
@Service
public class DocumentService {

    // POLICY, not fact. Mirrors RENEWAL_WINDOW_DAYS in src/utils/documents.js:
    // both sides must agree or a pill and a refusal will contradict each other.
    private static final long RENEWAL_WINDOW_DAYS = 30;

    private final CaregiverRepository caregivers;
    private final DocumentRepository documents;

    DocumentService(CaregiverRepository caregivers, DocumentRepository documents) {
        this.caregivers = caregivers;
        this.documents = documents;
    }

    // The Java twin of documentStatus() in src/utils/documents.js. `now` is a
    // parameter and never a clock read, so the answer can be reasoned about at a
    // chosen instant. Received means the office HAS something; no expiry date
    // means the credential never lapses, which is the background check.
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

    // Keyed by document id, never by name: a name is a label people correct, and
    // signing the wrong row because someone fixed a typo never announces itself.
    // The server reads the clock, because a caller who could choose the instant
    // could choose one where a lapsed card still looks signable.
    @Transactional
    public Caregiver sign(Long caregiverId, Long documentId, SignatureRequest request) {
        if (request == null) {
            throw new InvalidInputException("Signature request is required");
        }

        Document document = load(caregiverId, documentId);

        // One clock read: the status that refuses and the timestamp that records
        // cannot then disagree about when this happened.
        Instant now = Instant.now();
        DocumentStatus status = statusOf(document, now);

        // EXPIRED gets its own message because a signature does not renew a
        // lapsed credential. Naming the state without naming the exit tells the
        // office nothing about what to do next.
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

    // The office recording a document directly. Accepts a document in ANY state,
    // because this is both how a credential first arrives and how a lapsed one is
    // replaced, and it is the only exit from EXPIRED.
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

        // An expiry is optional: a document that never lapses is a real case, not
        // a missing answer. One already past is not, because it would file a
        // document straight into the state this call exists to clear.
        if (expiresAt != null && !expiresAt.isAfter(now)) {
            throw new InvalidInputException(
                    "That expiry date has already passed; record a current document");
        }

        document.setFileName(fileName);
        document.setFileSize(request.fileSize());
        document.setFileType(request.fileType());
        document.setIssuedAt(request.issuedAt());
        document.setExpiresAt(expiresAt);
        document.setReceivedAt(now);

        // Recording directly SUPERSEDES anything the caregiver sent in. Leaving
        // it pending would let someone accept it later and overwrite this newer
        // credential with the older one it replaced.
        document.clearPendingSubmission();

        return reload(caregiverId);
    }

    // The caregiver sending in a renewal themselves. It does NOT take effect: the
    // submission sits beside the live document until the office accepts it,
    // because a credential that cleared itself is one nobody checked.
    @Transactional
    public Caregiver submitRenewal(Long caregiverId, Long documentId, DocumentFileRequest request) {
        throw new UnsupportedOperationException("TODO: submit a renewal");
    }

    // The only step that makes a submitted renewal the credential of record.
    @Transactional
    public Caregiver acceptSubmission(Long caregiverId, Long documentId) {
        throw new UnsupportedOperationException("TODO: accept a submitted renewal");
    }

    // Fails closed on identity: a document belonging to a different caregiver
    // comes back empty and reads as not found, rather than letting one
    // caregiver's URL act on another's record.
    private Document load(Long caregiverId, Long documentId) {
        return documents.findByIdAndCaregiver_Id(documentId, caregiverId)
                .orElseThrow(() -> new NotFoundException(
                        "Document " + documentId + " not found for caregiver " + caregiverId));
    }

    private Caregiver reload(Long caregiverId) {
        return caregivers.findByIdWithDocuments(caregiverId)
                .orElseThrow(() -> new NotFoundException("Caregiver " + caregiverId + " not found"));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
