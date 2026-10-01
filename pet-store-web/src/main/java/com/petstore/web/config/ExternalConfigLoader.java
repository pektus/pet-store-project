package com.petstore.web.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Utility to discover and load external properties from ${APP_CONFIG_DIR}/apps/conf/.
 * <p>
 * Checks System properties (e.g. set in Tomcat's catalina.properties) first,
 * then falls back to OS environment variables.
 */
public final class ExternalConfigLoader {

    private static final Logger log = LoggerFactory.getLogger(ExternalConfigLoader.class);

    public static final String APP_CONFIG_DIR_KEY = "APP_CONFIG_DIR";
    public static final String APPS_DIR = "apps";
    public static final String CONF_DIR = "conf";

    private ExternalConfigLoader() {}

    /**
     * Resolves the external configuration directory: ${APP_CONFIG_DIR}/apps/conf
     *
     * @return Path to the configuration directory, or null if APP_CONFIG_DIR is not set or invalid.
     */
    public static Path resolveConfigDir() {
        String appConfigDir = System.getProperty(APP_CONFIG_DIR_KEY);
        if (appConfigDir == null || appConfigDir.isBlank()) {
            appConfigDir = System.getenv(APP_CONFIG_DIR_KEY);
        }

        if (appConfigDir == null || appConfigDir.isBlank()) {
            log.info("Property '{}' is not set in System properties (catalina.properties) or environment variables. Using classpath defaults.", APP_CONFIG_DIR_KEY);
            return null;
        }

        // Clean any surrounding quotes and whitespace
        String cleanDir = appConfigDir.trim();
        if ((cleanDir.startsWith("\"") && cleanDir.endsWith("\"")) ||
            (cleanDir.startsWith("'") && cleanDir.endsWith("'"))) {
            cleanDir = cleanDir.substring(1, cleanDir.length() - 1).trim();
        }

        Path confDir = Paths.get(cleanDir, APPS_DIR, CONF_DIR);

        if (!Files.exists(confDir)) {
            log.warn("External configuration directory does not exist: {}", confDir.toAbsolutePath());
            return null;
        }

        if (!Files.isDirectory(confDir)) {
            log.warn("External configuration path is not a directory: {}", confDir.toAbsolutePath());
            return null;
        }

        log.info("Resolved external configuration directory: {}", confDir.toAbsolutePath());
        return confDir;
    }

    /**
     * Discovers all external property file resources located within ${APP_CONFIG_DIR}/apps/conf/
     * <p>
     * Order of discovery:
     * 1. application.properties (if present)
     * 2. petstore.properties (if present)
     * 3. Any other *.properties files found in the directory
     *
     * @return list of Resource handles to external properties files, empty if none found.
     */
    public static List<Resource> getExternalPropertyResources() {
        Path confDir = resolveConfigDir();
        if (confDir == null) {
            return Collections.emptyList();
        }

        List<Resource> resources = new ArrayList<>();

        // 1. application.properties
        Path appProps = confDir.resolve("application.properties");
        if (Files.isRegularFile(appProps)) {
            log.info("Found external property file: {}", appProps.toAbsolutePath());
            resources.add(new FileSystemResource(appProps));
        }

        // 2. petstore.properties
        Path petstoreProps = confDir.resolve("petstore.properties");
        if (Files.isRegularFile(petstoreProps)) {
            log.info("Found external property file: {}", petstoreProps.toAbsolutePath());
            resources.add(new FileSystemResource(petstoreProps));
        }

        // 3. Any additional *.properties files in the directory
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(confDir, "*.properties")) {
            for (Path entry : stream) {
                if (!entry.equals(appProps) && !entry.equals(petstoreProps)) {
                    log.info("Found additional external property file: {}", entry.toAbsolutePath());
                    resources.add(new FileSystemResource(entry));
                }
            }
        } catch (IOException e) {
            log.warn("Error scanning directory for property files: {}", confDir.toAbsolutePath(), e);
        }

        return resources;
    }
}
