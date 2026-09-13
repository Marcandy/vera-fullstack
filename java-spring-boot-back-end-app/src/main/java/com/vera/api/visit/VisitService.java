package com.vera.api.visit;

// The rules live here, not in the controller and not in the entity. They ran in
// the browser until now, which meant they were suggestions.
public class VisitService {

    private final VisitRepository visits;

    VisitService(VisitRepository visits) {
        this.visits = visits;
    }

    // TODO(#18): checkIn(Long id, CheckInRequest location), @Transactional
    //   1. load, or throw new NotFoundException("Visit " + id + " not found")
    //   2. not SCHEDULED -> new IllegalTransitionException(
    //        "Cannot check in a visit that is " + status.label())
    //   3. checkInTime = Instant.now(), because a time the caller can author is
    //      not evidence
    //   4. copy the location, tolerating a null request
    //   5. status = IN_PROGRESS
    //
    // Step 4: null writes nothing, available true writes the three coordinates,
    // available false writes the reason. Never both, or the UI reports a
    // position for a fix that was refused.

    // TODO(#19): checkOut(Long id, EvidenceRequest evidence), @Transactional
    //   1. load, or throw NotFoundException
    //   2. not IN_PROGRESS -> IllegalTransitionException(
    //        "Cannot check out a visit that is " + status.label())
    //   3. checkOutTime = Instant.now()
    //   4. assessment and signature through blankToNull
    //   5. status = hasCompleteEvidence(visit) ? READY_TO_BILL : NEEDS_REVIEW

    // TODO(#18): hasCompleteEvidence(Visit) -> checkInTime, checkOutTime,
    // assessment and signature all present. A method, not four inline
    // conditions, because #20 asks the same question. Location is not one of
    // them: it never blocks billing.

    // TODO(#19): blankToNull(String) -> "   " stores as NULL. The client reads
    // null to mean missing and would treat "" as supplied.

    // TODO: @Transactional needs an import and this class needs @Service. Left
    // off so an empty bean does not sit in the context.

    // DESIGN QUESTION, and it decides the return type above.
    // open-in-view is false, so findById hands back lazy proxies and the
    // transaction closes when the method returns, before the controller reads
    // getPatient().getName(). Two answers: load with findByIdWithPeople and
    // return Visit, or build the VisitResponse in here while the session is
    // still open. Use the same one in both methods and in #20.
}
