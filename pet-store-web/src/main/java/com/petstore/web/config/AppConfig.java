package com.petstore.web.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.context.support.PropertySourcesPlaceholderConfigurer;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.util.ArrayList;
import java.util.List;

@Configuration
@ComponentScan(basePackages = {
        "com.petstore.service",
        "com.petstore.web"
})
@PropertySource(value = "classpath:application.properties")
public class AppConfig {

    private static final Logger log = LoggerFactory.getLogger(AppConfig.class);

    @Bean
    public static PropertySourcesPlaceholderConfigurer propertySourcesPlaceholderConfigurer() {
        PropertySourcesPlaceholderConfigurer configurer = new PropertySourcesPlaceholderConfigurer();

        List<Resource> locations = new ArrayList<>();
        // 1. Default classpath properties
        locations.add(new ClassPathResource("application.properties"));

        // 2. External configuration files from ${APP_CONFIG_DIR}/apps/conf/
        List<Resource> externalResources = ExternalConfigLoader.getExternalPropertyResources();
        if (!externalResources.isEmpty()) {
            locations.addAll(externalResources);
            log.info("Configured {} external property resource(s) from APP_CONFIG_DIR/apps/conf", externalResources.size());
        }

        configurer.setLocations(locations.toArray(new Resource[0]));
        configurer.setIgnoreResourceNotFound(true);
        configurer.setLocalOverride(true);
        return configurer;
    }
}
