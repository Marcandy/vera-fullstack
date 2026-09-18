package com.vera.api.caregiver;

import java.time.Instant;

import com.vera.api.IllegalTransitionException;
import com.vera.api.InvalidInputException;
import com.vera.api.NotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// The document rules, moved off the client. Until now they ran in
// caregiverService.js, which means they were suggestions: anything that can
// reach the API could ignore them. Read the comments above each mock verb in
// react-front-end-app/src/services/caregiverService.js before writing these.
// That file is the spec, and it already argues every rule below.
//
// Separate from CaregiverService because that one owns the caregiver as a
// whole, hiring and firing. These four verbs are about one document's life.
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
    // TODO 1: received means the office actually has something, a signature it
    //         captured OR a file it was sent. Until then nothing can expire,
    //         so return PENDING.
    // TODO 2: a document with no expiry date does not lapse. A completed
    //         background check is the real case. Return SIGNED.
    // TODO 3: expiry at or before `now` is EXPIRED. This is the one a stored
    //         status could never say, and the one that blocks clearance.
    // TODO 4: expiry inside the renewal window is EXPIRING. Careful with the
    //         arithmetic: RENEWAL_WINDOW_DAYS is days, `now` is an Instant.
    // TODO 5: anything else is SIGNED.
    static DocumentStatus statusOf(Document document, Instant now) {
        throw new UnsupportedOperationException("TODO: derive the document status");
    }

    // The caregiver signing their own document, or the office signing for one
    // they witnessed. Keyed by document id, never by name: a name is a label
    // people correct, and signing the wrong row because someone fixed a typo
    // is the kind of bug that never announces itself.
    //
    // TODO 1: load the document with load(), which already fails closed on the
    //         caregiver in the path.
    // TODO 2: derive its status with statusOf(document, Instant.now()). The
    //         server reads the clock here, not the caller: a caller that could
    //         choose the instant could choose one where a lapsed card still
    //         looks signable.
    // TODO 3: only PENDING is signable. Everything else is an
    //         IllegalTransitionException, which the advice maps to 409.
    // TODO 4: EXPIRED gets its OWN message. A signature does not renew a
    //         lapsed credential, and the only exit is recording a current one,
    //         which is what recordFile is for. Saying "cannot sign a document
    //         that is expired" tells the office nothing about what to do next.
    //         Look at the wording the mock uses and keep the instruction.
    // TODO 5: reject a blank signature with InvalidInputException (400).
    //         blankToNull() below is the guard the other services use.
    // TODO 6: set the signature and stamp receivedAt from the server clock.
    // TODO 7: return reload(caregiverId). See the note on reload() for why the
    //         managed entity is not enough.
    @Transactional
    public Caregiver sign(Long caregiverId, Long documentId, SignatureRequest request) {
        throw new UnsupportedOperationException("TODO: sign a document");
    }

    // The office recording a document directly. Unlike signing this accepts a
    // document in ANY state, because it is both how a credential first arrives
    // and how a lapsed one is replaced. That is the whole exit from EXPIRED,
    // and it works the way the visit evidence rule works: the hold clears when
    // the missing thing is supplied, never because someone dismissed it.
    //
    // TODO 1: load the document.
    // TODO 2: reject a blank file name (400).
    // TODO 3: an expiry is OPTIONAL. Leaving it blank is how a document that
    //         never lapses gets recorded, which is a real case and not a
    //         missing answer. Only validate it when one was sent.
    // TODO 4: reject an expiry already in the past (400). Accepting one would
    //         file a document straight into the state it is meant to clear.
    // TODO 5: copy the five metadata fields onto the live columns and stamp
    //         receivedAt from the server clock.
    // TODO 6: clear any pending submission with clearPendingSubmission().
    //         Recording directly SUPERSEDES what the caregiver sent in;
    //         leaving it pending would let someone accept it later and
    //         overwrite this newer credential with the older one it replaced.
    // TODO 7: return reload(caregiverId).
    @Transactional
    public Caregiver recordFile(Long caregiverId, Long documentId, DocumentFileRequest request) {
        throw new UnsupportedOperationException("TODO: record a document file");
    }

    // The CAREGIVER sending in a renewal themselves, which is how the real
    // products work: the aide photographs the new card rather than driving it
    // to the office.
    //
    // It does NOT take effect. The submission sits beside the live document
    // until someone at the agency accepts it, because the agency is what has to
    // produce a valid credential at a state survey, and a credential that
    // cleared itself is one nobody checked.
    //
    // TODO 1: load the document.
    // TODO 2: same two validations as recordFile: a file name is required, and
    //         an expiry, if sent, cannot already have passed.
    // TODO 3: write ONLY the pending_ columns. Touch no live field. Two things
    //         follow from that and both are the point: renewing early cannot
    //         invalidate a card still in force, and a lapsed caregiver stays
    //         lapsed until the office looks.
    // TODO 4: stamp pendingSubmittedAt from the server clock. That field is
    //         what DocumentResponse reads to decide whether `submission` is
    //         null, so a submission without it is invisible to the frontend.
    // TODO 5: return reload(caregiverId).
    @Transactional
    public Caregiver submitRenewal(Long caregiverId, Long documentId, DocumentFileRequest request) {
        throw new UnsupportedOperationException("TODO: submit a renewal");
    }

    // The office accepting what was sent in. Only here does a submitted renewal
    // become the credential of record.
    //
    // TODO 1: load the document.
    // TODO 2: nothing pending is a 409, not a silent success. There is
    //         deliberately no accept that invents evidence, for the same reason
    //         no button resolves a visit missing its signature.
    // TODO 3: promote the five pending values onto the live fields.
    // TODO 4: receivedAt becomes the moment the caregiver SENT it, not the
    //         moment you accepted it. The office checking the card is not when
    //         the agency came into possession of it.
    // TODO 5: null the signature. The live credential is now a file somebody
    //         sent in, and the old signature attested to the document this one
    //         replaces.
    // TODO 6: clear the submission slot.
    // TODO 7: return reload(caregiverId).
    @Transactional
    public Caregiver acceptSubmission(Long caregiverId, Long documentId) {
        throw new UnsupportedOperationException("TODO: accept a submitted renewal");
    }

    // Fails closed on identity: a document id that belongs to a different
    // caregiver comes back empty and reads as not found, rather than letting
    // one caregiver's URL act on another's record.
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
