package com.vera.api.caregiver;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Documents hang off a caregiver, so the URLs nest under one. Separate class
// from CaregiverController because that one is about the caregiver resource
// and these are about one document's life.
//
// NO RULES LIVE HERE. Every method loads nothing, decides nothing and validates
// nothing: it hands the ids and the body to DocumentService and maps what comes
// back. The 404 and the 409 both arrive as exceptions the advice already
// translates.
//
// ⚠ Every endpoint returns the WHOLE CAREGIVER, not the document. MyDocuments
// and CaregiverDetail both do setCaregiver(await verb(...)), so returning a
// DocumentResponse would leave both pages rendering a caregiver-shaped hole.
// That is what keeps the component files untouched by this PR.
@RestController
@RequestMapping("/api/caregivers/{caregiverId}/documents")
public class DocumentController {

    private final DocumentService documentService;

    DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    // TODO 1: @PostMapping("/{documentId}/signature")
    //         Body is a SignatureRequest. Return CaregiverResponse.from(...) of
    //         what the service returns. A plain return is a 200, which is right:
    //         nothing was created, an existing row was completed.
    public CaregiverResponse sign(
            @PathVariable Long caregiverId,
            @PathVariable Long documentId,
            @RequestBody SignatureRequest request) {
        throw new UnsupportedOperationException("TODO: map the signature endpoint");
    }

    // TODO 2: @PostMapping("/{documentId}/file")
    //         This is the office recording a document directly, the mock's
    //         uploadDocument. Body is a DocumentFileRequest.
    public CaregiverResponse recordFile(
            @PathVariable Long caregiverId,
            @PathVariable Long documentId,
            @RequestBody DocumentFileRequest request) {
        throw new UnsupportedOperationException("TODO: map the record-file endpoint");
    }

    // TODO 3: @PostMapping("/{documentId}/submission")
    //         The caregiver sending in a renewal. Same body type as above and
    //         deliberately a different endpoint, because the rules differ: this
    //         one must not touch the live credential.
    public CaregiverResponse submitRenewal(
            @PathVariable Long caregiverId,
            @PathVariable Long documentId,
            @RequestBody DocumentFileRequest request) {
        throw new UnsupportedOperationException("TODO: map the submission endpoint");
    }

    // TODO 4: @PostMapping("/{documentId}/submission/acceptance")
    //         No body at all: accepting carries no new information, it is the
    //         office saying yes to what is already stored. Note there is no
    //         @RequestBody parameter to add.
    public CaregiverResponse acceptSubmission(
            @PathVariable Long caregiverId,
            @PathVariable Long documentId) {
        throw new UnsupportedOperationException("TODO: map the acceptance endpoint");
    }
}
