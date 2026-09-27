package com.vera.api.caregiver;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Every endpoint returns the whole caregiver: both pages replace their state with it.
@RestController
@RequestMapping("/api/caregivers/{caregiverId}/documents")
public class DocumentController {

    private final DocumentService documentService;

    DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping("/{documentId}/signature")
    public CaregiverResponse sign(
            @PathVariable Long caregiverId,
            @PathVariable Long documentId,
            @RequestBody(required = false) SignatureRequest request) {
        return CaregiverResponse.from(documentService.sign(caregiverId, documentId, request));
    }

    @PostMapping("/{documentId}/file")
    public CaregiverResponse recordFile(
            @PathVariable Long caregiverId,
            @PathVariable Long documentId,
            @RequestBody(required = false) DocumentFileRequest request) {
        return CaregiverResponse.from(documentService.recordFile(caregiverId, documentId, request));
    }

    @PostMapping("/{documentId}/submission")
    public CaregiverResponse submitRenewal(
            @PathVariable Long caregiverId,
            @PathVariable Long documentId,
            @RequestBody(required = false) DocumentFileRequest request) {
        return CaregiverResponse.from(
                documentService.submitRenewal(caregiverId, documentId, request));
    }

    @PostMapping("/{documentId}/submission/acceptance")
    public CaregiverResponse acceptSubmission(
            @PathVariable Long caregiverId,
            @PathVariable Long documentId) {
        return CaregiverResponse.from(documentService.acceptSubmission(caregiverId, documentId));
    }
}
