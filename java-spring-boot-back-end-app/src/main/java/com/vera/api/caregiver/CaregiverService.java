package com.vera.api.caregiver;

import com.vera.api.IllegalTransitionException;
import com.vera.api.InvalidInputException;
import com.vera.api.NotFoundException;
import com.vera.api.visit.VisitRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// The rules live here: a new hire gets a blank checklist, and a caregiver
// with visits is not deleted. The controller maps HTTP; the entity holds rows.
@Service
public class CaregiverService {

    private final CaregiverRepository caregivers;
    private final VisitRepository visits;

    CaregiverService(CaregiverRepository caregivers, VisitRepository visits) {
        this.caregivers = caregivers;
        this.visits = visits;
    }

    @Transactional
    public Caregiver add(CreateCaregiverRequest request) {
        // TODO 1: if request is null, throw InvalidInputException.
        //         Blank or missing name is "Caregiver name is required".
        //         Phone is optional. Trim blanks to null the way PatientService
        //         does (blankToNull).
        // TODO 2: Caregiver caregiver = new Caregiver(name, phone);
        //         There is an all-args constructor for those two fields.
        // TODO 3: save the caregiver, then create four Document rows named
        //         exactly: "State ID", "Background Check",
        //         "CPR Certification", "TB Test". Use new Document(caregiver,
        //         name). Leave every evidence and pending field null. Add each
        //         to caregiver.getDocuments() so cascade persists them.
        // TODO 4: return caregivers.findByIdWithDocuments(saved.getId())
        //         or throw NotFoundException. open-in-view is false, so names
        //         on the checklist have to be loaded inside this transaction.
        //         Replace the placeholder throw when you implement the method.
        throw new UnsupportedOperationException("add is not implemented yet");
    }

    @Transactional
    public void delete(Long id) {
        // TODO 1: load with caregivers.findById(id). If absent, throw
        //         NotFoundException with "Caregiver <id> not found".
        // TODO 2: if visits.existsByCaregiver_Id(id) is true, throw
        //         IllegalTransitionException:
        //         "Cannot delete a caregiver who has visits".
        //         Marcus and anyone on the schedule stay.
        // TODO 3: caregivers.delete(caregiver). Cascade and orphanRemoval
        //         remove their documents. This is the line that removes a row.
        //         Replace the placeholder throw when you implement the method.
        throw new UnsupportedOperationException("delete is not implemented yet");
    }
}
