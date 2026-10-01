package com.petstore.service.service.impl;

import com.petstore.service.exception.InvalidFileException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileSystemStorageServiceTest {

    @TempDir
    Path tempDir;

    private FileSystemStorageService storageService;

    @BeforeEach
    void setUp() {
        storageService = new FileSystemStorageService(tempDir.toString());
        storageService.init();
    }

    @Test
    @DisplayName("Should successfully store valid JPEG image and load resource")
    void testStoreAndLoad() throws Exception {
        byte[] content = "fake-jpeg-image-bytes".getBytes();
        InputStream stream = new ByteArrayInputStream(content);

        String storedFilename = storageService.store(stream, "puppy.jpg", "image/jpeg");

        assertThat(storedFilename).endsWith(".jpg");
        assertThat(Files.exists(tempDir.resolve(storedFilename))).isTrue();

        Resource resource = storageService.loadAsResource(storedFilename);
        assertThat(resource.exists()).isTrue();
        assertThat(resource.isReadable()).isTrue();
    }

    @Test
    @DisplayName("Should reject prohibited MIME types")
    void testRejectInvalidMimeType() {
        byte[] content = "executable-bytes".getBytes();
        InputStream stream = new ByteArrayInputStream(content);

        assertThatThrownBy(() -> storageService.store(stream, "script.sh", "application/x-sh"))
                .isInstanceOf(InvalidFileException.class)
                .hasMessageContaining("Unsupported media type");
    }

    @Test
    @DisplayName("Should delete stored file safely")
    void testDeleteFile() {
        byte[] content = "image-bytes".getBytes();
        String storedFilename = storageService.store(new ByteArrayInputStream(content), "photo.png", "image/png");

        assertThat(Files.exists(tempDir.resolve(storedFilename))).isTrue();

        storageService.delete(storedFilename);
        assertThat(Files.exists(tempDir.resolve(storedFilename))).isFalse();
    }
}
