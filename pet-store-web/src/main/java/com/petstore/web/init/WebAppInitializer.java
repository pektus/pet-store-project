package com.petstore.web.init;

import com.petstore.web.config.AppConfig;
import com.petstore.web.config.JpaConfig;
import com.petstore.web.config.SecurityConfig;
import com.petstore.web.config.StorageConfig;
import com.petstore.web.config.WebMvcConfig;
import jakarta.servlet.Filter;
import jakarta.servlet.MultipartConfigElement;
import jakarta.servlet.ServletRegistration;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.web.filter.DelegatingFilterProxy;
import org.springframework.web.servlet.support.AbstractAnnotationConfigDispatcherServletInitializer;

public class WebAppInitializer extends AbstractAnnotationConfigDispatcherServletInitializer {

    @Override
    protected ApplicationContextInitializer<?>[] getRootApplicationContextInitializers() {
        return new ApplicationContextInitializer<?>[] {
            new ExternalConfigApplicationContextInitializer()
        };
    }

    @Override
    protected ApplicationContextInitializer<?>[] getServletApplicationContextInitializers() {
        return new ApplicationContextInitializer<?>[] {
            new ExternalConfigApplicationContextInitializer()
        };
    }

    // 5 MB max per file, 10 MB max request, 1 MB threshold for disk flush
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final long MAX_REQUEST_SIZE = 10 * 1024 * 1024;
    private static final int FILE_SIZE_THRESHOLD = 1 * 1024 * 1024;

    @Override
    protected Class<?>[] getRootConfigClasses() {
        return new Class<?>[] {
            AppConfig.class,
            JpaConfig.class,
            SecurityConfig.class,
            StorageConfig.class
        };
    }

    @Override
    protected Class<?>[] getServletConfigClasses() {
        return new Class<?>[] { WebMvcConfig.class };
    }

    @Override
    protected String[] getServletMappings() {
        return new String[] { "/" };
    }

    @Override
    protected Filter[] getServletFilters() {
        return new Filter[] {
            new DelegatingFilterProxy("springSecurityFilterChain")
        };
    }

    @Override
    protected void customizeRegistration(ServletRegistration.Dynamic registration) {
        // Configure standard Servlet 6.0 Multipart configuration
        MultipartConfigElement multipartConfigElement = new MultipartConfigElement(
                null,
                MAX_FILE_SIZE,
                MAX_REQUEST_SIZE,
                FILE_SIZE_THRESHOLD
        );
        registration.setMultipartConfig(multipartConfigElement);
    }
}
