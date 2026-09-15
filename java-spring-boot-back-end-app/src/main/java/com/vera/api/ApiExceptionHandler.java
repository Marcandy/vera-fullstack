package com.vera.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// One advice for the whole API rather than try/catch per controller. The service
// throws what the domain means; this decides what HTTP calls it.
@RestControllerAdvice
public class ApiExceptionHandler {

    // 409 and not 400: the request was well formed, it is the visit's current
    // state that makes it impossible, which is what Conflict means.
    @ExceptionHandler(IllegalTransitionException.class)
    public ResponseEntity<ApiError> handleIllegalTransition(IllegalTransitionException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiError(exception.getMessage()));
    }

    @ExceptionHandler(InvalidInputException.class)
    public ResponseEntity<ApiError> handleInvalidInput(InvalidInputException exception) {
        return ResponseEntity.badRequest()
                .body(new ApiError(exception.getMessage()));
    }
}
