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
        if (request == null) {
            throw new InvalidInputException("Caregiver request is required");
        }
        String name = blankToNull(request.name());
        String phone = blankToNull(request.phone());
        if (name == null) {
            throw new InvalidInputException("Caregiver name is required");
        }

        Caregiver caregiver = new Caregiver(name, phone);
        for (String documentName : new String[] {
                "State ID",
                "Background Check",
                "CPR Certification",
                "TB Test"
        }) {
            caregiver.getDocuments().add(new Document(caregiver, documentName));
        }

        Caregiver saved = caregivers.save(caregiver);
        return caregivers.findByIdWithDocuments(saved.getId())
                .orElseThrow(() -> new NotFoundException(
                        "Caregiver " + saved.getId() + " not found"));
    }

    @Transactional
    public void delete(Long id) {
        Caregiver caregiver = caregivers.findById(id)
                .orElseThrow(() -> new NotFoundException("Caregiver " + id + " not found"));

        if (visits.existsByCaregiver_Id(id)) {
            throw new IllegalTransitionException(
                    "Cannot delete a caregiver who has visits");
        }

        caregivers.delete(caregiver);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
