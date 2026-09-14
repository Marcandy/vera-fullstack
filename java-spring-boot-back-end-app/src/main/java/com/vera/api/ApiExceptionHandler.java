package com.vera.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// One advice for the whole API rather than try/catch per controller. The service
// throws what the domain means; this decides what HTTP calls it.
//
// Only the refusal is handled. A not-found POST and a malformed query parameter
// are not reachable by clicking, so they stay on Spring's default.
@RestControllerAdvice
public class ApiExceptionHandler {

    // 409 and not 400: the request was well formed, it is the visit's current
    // state that makes it impossible, which is what Conflict means.
    @ExceptionHandler(IllegalTransitionException.class)
    public ResponseEntity<ApiError> handleIllegalTransition(IllegalTransitionException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiError(exception.getMessage()));
    }
}
