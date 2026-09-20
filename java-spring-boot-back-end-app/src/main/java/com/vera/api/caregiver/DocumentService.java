package com.vera.api.caregiver;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import com.vera.api.IllegalTransitionException;
import com.vera.api.InvalidInputException;
import com.vera.api.NotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// The document rules, moved off the client. Until now they ran in
// caregiverService.js, which means they were suggestions: anything that could
// reach the API could ignore them. Read the comments above each mock verb in
// react-front-end-app/src/services/caregiverService.js before writing these.
// That file is the spec, and it already argues every rule below.
//
// Separate from CaregiverService because that one owns the caregiver as a
// whole, hiring and firing. These four verbs are about one document's life.
//
// EVERY VERB follows the same two mechanical steps, so they are not numbered
// below: start with load(caregiverId, documentId), end with
// return reload(caregiverId). The numbered TODOs are only the decisions.
@Service
public class DocumentService {

    // POLICY, not fact: how close to expiry a document starts asking to be
    // renewed. Mirrors RENEWAL_WINDOW_DAYS in src/utils/documents.js. Both
    // sides must agree or a pill and a refusal will contradict each other.
    private static final long RENEWAL_WINDOW_DAYS = 30;

    private final CaregiverRepository caregivers;
    private final DocumentRepository documents;

    DocumentService(CaregiverRepository caregivers, DocumentRepository documents) {
        this.caregivers = caregivers;
        this.documents = documents;
    }

    // The Java twin of documentStatus() in src/utils/documents.js:23.
    //
    // `now` is a parameter and is never read from the clock in here, for the
    // same reason it is a parameter in the JS: a function that calls the clock
    // itself cannot be reasoned about at a chosen instant, and it hides that
    // its answer changes underneath the caller.
    //
    // Received means the office actually HAS something, a signature it captured
    // or a file it was sent. Until then nothing can expire. A document with no
    // expiry does not lapse at all, which is the completed background check.
    static DocumentStatus statusOf(Document document, Instant now) {
        boolean received = document.getSignature() != null || document.getFileName() != null;

        if (!received) return DocumentStatus.PENDING;

        Instant expiresAt = document.getExpiresAt();
        if (expiresAt == null) return DocumentStatus.SIGNED;

        if (!expiresAt.isAfter(now)) return DocumentStatus.EXPIRED;
        if (!expiresAt.isAfter(now.plus(RENEWAL_WINDOW_DAYS, ChronoUnit.DAYS))) 
            return DocumentStatus.EXPIRING;
        
        return DocumentStatus.SIGNED;
    }

    // The caregiver signing their own document, or the office signing for one
    // they witnessed. Keyed by document id, not by name: a name is a label
    // people correct, and signing the wrong row because someone fixed a typo is
    // the kind of bug that never announces itself.
    //
    // The server reads the clock here, not the caller. A caller that could
    // choose the instant could choose one where a lapsed card still looks
    // signable.
    //
    // TODO 1: only a PENDING document is signable. Anything else is an
    //         IllegalTransitionException, which the advice maps to 409.
    // TODO 2: EXPIRED gets its OWN message. A signature does not renew a lapsed
    //         credential, and the only exit is recording a current one. Saying
    //         "cannot sign a document that is expired" tells the office nothing
    //         about what to do next; the mock's wording keeps the instruction.
    // TODO 3: reject a blank signature (InvalidInputException, 400), then set
    //         it and stamp receivedAt from the server clock.
    @Transactional
    public Caregiver sign(Long caregiverId, Long documentId, SignatureRequest request) {
        throw new UnsupportedOperationException("TODO: sign a document");
    }

    // The office recording a document directly. Unlike signing this accepts a
    // document in ANY state, because it is both how a credential first arrives
    // and how a lapsed one is replaced. That is the whole exit from EXPIRED, and
    // it works the way the visit evidence rule works: the hold clears when the
    // missing thing is supplied, never because someone dismissed it.
    //
    // TODO 1: a file name is required (400). An expiry is NOT: leaving it blank
    //         is how a document that never lapses gets recorded, which is a real
    //         case and not a missing answer.
    // TODO 2: when an expiry IS sent, reject one already in the past. Accepting
    //         it would file a document straight into the state it is meant to
    //         clear.
    // TODO 3: copy the five metadata fields onto the live columns, stamp
    //         receivedAt, then clearPendingSubmission(). Recording directly
    //         SUPERSEDES what the caregiver sent in; leaving it pending would
    //         let someone accept it later and overwrite this newer credential
    //         with the older one it replaced.
    @Transactional
    public Caregiver recordFile(Long caregiverId, Long documentId, DocumentFileRequest request) {
        throw new UnsupportedOperationException("TODO: record a document file");
    }

    // The CAREGIVER sending in a renewal themselves. This is how the real
    // products work: the aide photographs the new card rather than driving it to
    // the office.
    //
    // It does NOT take effect. The submission sits beside the live document
    // until someone at the agency accepts it, because the agency is what has to
    // produce a valid credential at a state survey, and a credential that
    // cleared itself is one nobody checked.
    //
    // TODO 1: same two validations as recordFile, a file name is required and a
    //         sent expiry cannot already have passed.
    // TODO 2: write ONLY the pending_ columns. Touch no live field. Two things
    //         follow and both are the point: renewing early cannot invalidate a
    //         card still in force, and a lapsed caregiver stays lapsed until the
    //         office looks.
    // TODO 3: stamp pendingSubmittedAt from the server clock. DocumentResponse
    //         reads that field to decide whether the submission is null, so a
    //         submission without it is invisible to the frontend.
    @Transactional
    public Caregiver submitRenewal(Long caregiverId, Long documentId, DocumentFileRequest request) {
        throw new UnsupportedOperationException("TODO: submit a renewal");
    }

    // The office accepting what was sent in. Only here does a submitted renewal
    // become the credential of record.
    //
    // TODO 1: nothing pending is a 409, not a silent success. There is
    //         deliberately no accept that invents evidence, for the same reason
    //         no button resolves a visit missing its signature.
    // TODO 2: promote the five pending values onto the live fields, and set
    //         receivedAt to the moment the caregiver SENT it, not the moment you
    //         accepted it. Checking the card is not when the agency came into
    //         possession of it.
    // TODO 3: null the signature, then clear the submission slot. The live
    //         credential is now a file somebody sent in, and the old signature
    //         attested to the document this one replaces.
    @Transactional
    public Caregiver acceptSubmission(Long caregiverId, Long documentId) {
        throw new UnsupportedOperationException("TODO: accept a submitted renewal");
    }

    // Fails closed on identity: a document id that belongs to a different
    // caregiver comes back empty and reads as not found, rather than letting one
    // caregiver's URL act on another's record.
    private Document load(Long caregiverId, Long documentId) {
        return documents.findByIdAndCaregiver_Id(documentId, caregiverId)
                .orElseThrow(() -> new NotFoundException(
                        "Document " + documentId + " not found for caregiver " + caregiverId));
    }

    // Re-reads through the join fetch so the controller can map the checklist
    // after the transaction closes. open-in-view is false, so the managed
    // entity's lazy documents would throw on the way out. Same fix
    // CaregiverService.add uses, and the same lesson as findByIdWithPeople.
    private Caregiver reload(Long caregiverId) {
        return caregivers.findByIdWithDocuments(caregiverId)
                .orElseThrow(() -> new NotFoundException("Caregiver " + caregiverId + " not found"));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
