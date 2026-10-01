package com.petstore.web.init;

import com.petstore.web.config.ExternalConfigLoader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MutablePropertySources;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePropertySource;

import java.io.IOException;
import java.util.List;

/**
 * Spring ApplicationContextInitializer that activates before application context refresh,
 * loading any external configuration properties from ${APP_CONFIG_DIR}/apps/conf/
 * into the Spring Environment.
 * <p>
 * This allows settings defined in Tomcat's catalina.properties (e.g. APP_CONFIG_DIR=/path/to/base)
 * to take effect immediately for all Spring beans, JPA configurations, and services.
 */
public class ExternalConfigApplicationContextInitializer 
        implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    private static final Logger log = LoggerFactory.getLogger(ExternalConfigApplicationContextInitializer.class);

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment environment = applicationContext.getEnvironment();
        MutablePropertySources propertySources = environment.getPropertySources();

        List<Resource> externalResources = ExternalConfigLoader.getExternalPropertyResources();
        if (externalResources.isEmpty()) {
            log.info("No external property files loaded by ExternalConfigApplicationContextInitializer.");
            return;
        }

        for (Resource resource : externalResources) {
            try {
                String sourceName = "externalConfig:" + (resource.getFilename() != null ? resource.getFilename() : resource.getDescription());
                ResourcePropertySource propertySource = new ResourcePropertySource(sourceName, resource);
                
                // Add to property sources so external values take precedence over internal classpath defaults
                propertySources.addLast(propertySource);
                log.info("Registered external property source '{}' from {}", sourceName, resource.getURI());
            } catch (IOException e) {
                log.warn("Failed to load external property resource '{}': {}", resource, e.getMessage());
            }
        }
    }
}
