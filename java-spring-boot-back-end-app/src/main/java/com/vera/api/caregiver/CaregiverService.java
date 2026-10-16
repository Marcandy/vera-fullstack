package com.vera.api.caregiver;

import static com.vera.api.Inputs.blankToNull;

import java.util.List;

import com.vera.api.IllegalTransitionException;
import com.vera.api.InvalidInputException;
import com.vera.api.NotFoundException;
import com.vera.api.auth.CurrentUser;
import com.vera.api.user.UserAccountRepository;
import com.vera.api.visit.VisitRepository;

import org.springframework.stereotype.Service;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;

@Service
@PreAuthorize("hasRole('ADMIN')")
public class CaregiverService {

    private final CaregiverRepository caregivers;
    private final VisitRepository visits;
    private final UserAccountRepository users;
    private final CurrentUser currentUser;

    CaregiverService(CaregiverRepository caregivers, VisitRepository visits,
            UserAccountRepository users, CurrentUser currentUser) {
        this.caregivers = caregivers;
        this.visits = visits;
        this.users = users;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<Caregiver> findAll() {
        return caregivers.findAllWithDocuments();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'CAREGIVER')")
    @Transactional(readOnly = true)
    public Caregiver findById(Long id) {
        if (!currentUser.isAdmin()) {
            currentUser.requireOwnership(id);
        }
        return caregivers.findByIdWithDocuments(id)
                .orElseThrow(() -> new NotFoundException("Record not found"));
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
        if (users.existsByCaregiver_Id(id)) {
            throw new IllegalTransitionException(
                    "Cannot delete a caregiver who has a sign-in");
        }

        caregivers.delete(caregiver);
    }
}
