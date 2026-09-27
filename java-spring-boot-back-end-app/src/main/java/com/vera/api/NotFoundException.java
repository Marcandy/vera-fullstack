package com.vera.api;

// Runtime, not checked: @Transactional rolls back on runtime exceptions and
// commits on checked ones.
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
