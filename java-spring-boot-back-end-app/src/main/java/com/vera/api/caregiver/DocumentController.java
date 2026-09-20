package com.vera.api.caregiver;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Documents hang off a caregiver, so the URLs nest under one. No rules here:
// every method hands the ids and the body to DocumentService and maps what
// comes back. The 404 and the 409 arrive as exceptions the advice translates.
//
// Every endpoint returns the WHOLE CAREGIVER, not the document, because both
// MyDocuments and CaregiverDetail call setCaregiver with the result. Returning
// a DocumentResponse would leave each of them rendering a caregiver-shaped hole.
@RestController
@RequestMapping("/api/caregivers/{caregiverId}/documents")
public class DocumentController {

    private final DocumentService documentService;

    DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    // 200, not 201: nothing was created, an existing row was completed.
    @PostMapping("/{documentId}/signature")
    public CaregiverResponse sign(
            @PathVariable Long caregiverId,
            @PathVariable Long documentId,
            @RequestBody(required = false) SignatureRequest request) {
        return CaregiverResponse.from(documentService.sign(caregiverId, documentId, request));
    }

    // The office recording a document directly, the mock's uploadDocument.
    @PostMapping("/{documentId}/file")
    public CaregiverResponse recordFile(
            @PathVariable Long caregiverId,
            @PathVariable Long documentId,
            @RequestBody(required = false) DocumentFileRequest request) {
        return CaregiverResponse.from(documentService.recordFile(caregiverId, documentId, request));
    }

    // Same body as recordFile and deliberately a different endpoint, because the
    // rules differ: this one must not touch the live credential.
    @PostMapping("/{documentId}/submission")
    public CaregiverResponse submitRenewal(
            @PathVariable Long caregiverId,
            @PathVariable Long documentId,
            @RequestBody(required = false) DocumentFileRequest request) {
        return CaregiverResponse.from(
                documentService.submitRenewal(caregiverId, documentId, request));
    }

    // No body: accepting carries no new information, it is the office saying yes
    // to what is already stored.
    @PostMapping("/{documentId}/submission/acceptance")
    public CaregiverResponse acceptSubmission(
            @PathVariable Long caregiverId,
            @PathVariable Long documentId) {
        return CaregiverResponse.from(documentService.acceptSubmission(caregiverId, documentId));
    }
}
