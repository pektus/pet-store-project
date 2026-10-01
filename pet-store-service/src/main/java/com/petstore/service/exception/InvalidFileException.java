package com.petstore.service.exception;

public class InvalidFileException extends StorageException {
    public InvalidFileException(String message) {
        super(message);
    }
}
