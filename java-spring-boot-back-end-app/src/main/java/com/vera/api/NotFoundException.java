package com.vera.api;

// Runtime, not checked: @Transactional rolls back on a RuntimeException and
// COMMITS on a checked one, so a checked exception here would leave a half
// applied write in the database.
//
// Root package rather than visit/, because patients and caregivers throw the
// same two, and a feature package other features import is not a feature
// package.
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
