package com.vera.api;

import com.vera.api.auth.TooManyAttemptsException;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataAccessException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(NotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiError("Record not found"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException exception) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiError("You do not have access to that."));
    }

    @ExceptionHandler(AuthenticationCredentialsNotFoundException.class)
    public ResponseEntity<ApiError> handleMissingAuthentication(
            AuthenticationCredentialsNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiError("Sign in to continue."));
    }

    @ExceptionHandler({DataAccessException.class, AuthenticationServiceException.class})
    public ResponseEntity<ApiError> handleUnavailable(RuntimeException exception) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ApiError("The service is temporarily unavailable. Try again."));
    }

    // 409, not 400: the request is valid, the visit's current state forbids it.
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

    // One message for every sign-in failure: naming which part was wrong tells an
    // attacker which emails have accounts.
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthentication(AuthenticationException exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiError("Email or password is incorrect"));
    }

    @ExceptionHandler(TooManyAttemptsException.class)
    public ResponseEntity<ApiError> handleTooManyAttempts(TooManyAttemptsException exception) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(exception.getRetryAfterSeconds()))
                .body(new ApiError(exception.getMessage()));
    }
}
