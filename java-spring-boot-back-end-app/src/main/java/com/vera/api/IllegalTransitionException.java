package com.vera.api;

// A refusal the domain makes, not a programming error: checking in a visit that
// is already billed is a thing a caregiver can legitimately try. Becomes a 409.
public class IllegalTransitionException extends RuntimeException {

    public IllegalTransitionException(String message) {
        super(message);
    }
}
