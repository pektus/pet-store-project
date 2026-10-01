package com.petstore.web.config;

import com.petstore.web.init.ExternalConfigApplicationContextInitializer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.PropertySourcesPlaceholderConfigurer;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.io.Resource;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ExternalConfigTest {

    private String originalAppConfigDir;

    @BeforeEach
    void setUp() {
        originalAppConfigDir = System.getProperty(ExternalConfigLoader.APP_CONFIG_DIR_KEY);
    }

    @AfterEach
    void tearDown() {
        if (originalAppConfigDir != null) {
            System.setProperty(ExternalConfigLoader.APP_CONFIG_DIR_KEY, originalAppConfigDir);
        } else {
            System.clearProperty(ExternalConfigLoader.APP_CONFIG_DIR_KEY);
        }
    }

    @Test
    @DisplayName("Should return null/empty when APP_CONFIG_DIR is not set")
    void testWhenAppConfigDirNotSet() {
        System.clearProperty(ExternalConfigLoader.APP_CONFIG_DIR_KEY);

        Path resolved = ExternalConfigLoader.resolveConfigDir();
        assertThat(resolved).isNull();

        List<Resource> resources = ExternalConfigLoader.getExternalPropertyResources();
        assertThat(resources).isEmpty();
    }

    @Test
    @DisplayName("Should discover property files when APP_CONFIG_DIR/apps/conf exists")
    void testDiscoverPropertiesFiles(@TempDir Path tempDir) throws IOException {
        Path confDir = tempDir.resolve("apps").resolve("conf");
        Files.createDirectories(confDir);

        Path appProps = confDir.resolve("application.properties");
        Files.writeString(appProps, "db.username=custom_admin\ncustom.test.key=custom_value\n");

        Path extraProps = confDir.resolve("petstore.properties");
        Files.writeString(extraProps, "app.storage.upload-dir=/var/custom/storage\n");

        System.setProperty(ExternalConfigLoader.APP_CONFIG_DIR_KEY, tempDir.toString());

        Path resolved = ExternalConfigLoader.resolveConfigDir();
        assertThat(resolved).isNotNull();
        assertThat(resolved).isEqualTo(confDir);

        List<Resource> resources = ExternalConfigLoader.getExternalPropertyResources();
        assertThat(resources).hasSize(2);
        assertThat(resources.stream().map(Resource::getFilename))
                .containsExactlyInAnyOrder("application.properties", "petstore.properties");
    }

    @Test
    @DisplayName("Should load external properties via ExternalConfigApplicationContextInitializer and override defaults")
    void testInitializerOverridesProperties(@TempDir Path tempDir) throws IOException {
        Path confDir = tempDir.resolve("apps").resolve("conf");
        Files.createDirectories(confDir);

        Path appProps = confDir.resolve("application.properties");
        Files.writeString(appProps, "db.username=override_user\nmy.custom.property=hello_world\n");

        System.setProperty(ExternalConfigLoader.APP_CONFIG_DIR_KEY, tempDir.toString());

        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()) {
            // Apply the initializer
            ExternalConfigApplicationContextInitializer initializer = new ExternalConfigApplicationContextInitializer();
            initializer.initialize(context);

            context.register(TestConfig.class);
            context.refresh();

            ConfigurableEnvironment env = context.getEnvironment();
            assertThat(env.getProperty("my.custom.property")).isEqualTo("hello_world");
            assertThat(env.getProperty("db.username")).isEqualTo("override_user");

            TestBean bean = context.getBean(TestBean.class);
            assertThat(bean.username).isEqualTo("override_user");
            assertThat(bean.customProp).isEqualTo("hello_world");
        }
    }

    @Configuration
    static class TestConfig {
        @Bean
        public static PropertySourcesPlaceholderConfigurer testConfigurer() {
            return AppConfig.propertySourcesPlaceholderConfigurer();
        }

        @Bean
        public TestBean testBean(@Value("${db.username}") String username,
                                 @Value("${my.custom.property:default_value}") String customProp) {
            return new TestBean(username, customProp);
        }
    }

    static class TestBean {
        final String username;
        final String customProp;

        TestBean(String username, String customProp) {
            this.username = username;
            this.customProp = customProp;
        }
    }
}
