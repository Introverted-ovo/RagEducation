package org.example.exception;

public class RAGException extends RuntimeException {

    public RAGException(String message) {
        super(message);
    }

    public RAGException(String message, Throwable cause) {
        super(message, cause);
    }
}
