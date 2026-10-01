package com.petstore.domain.dto;

import com.petstore.domain.enums.PetStatus;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class PetCreateRequestTest {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        try (ValidatorFactory factory = Validation.byDefaultProvider()
                .configure()
                .messageInterpolator(new org.hibernate.validator.messageinterpolation.ParameterMessageInterpolator())
                .buildValidatorFactory()) {
            validator = factory.getValidator();
        }
    }

    @Test
    @DisplayName("Should pass validation when all fields are valid")
    void testValidPetCreateRequest() {
        PetCreateRequest request = new PetCreateRequest(
                "Bella",
                "Dog",
                "Golden Retriever",
                12,
                new BigDecimal("450.00"),
                PetStatus.AVAILABLE,
                "Friendly and energetic dog",
                "/api/media/photo1.jpg"
        );

        Set<ConstraintViolation<PetCreateRequest>> violations = validator.validate(request);
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("Should fail validation when name is blank or too short")
    void testBlankName() {
        PetCreateRequest request = new PetCreateRequest(
                " ",
                "Dog",
                "Golden Retriever",
                12,
                new BigDecimal("450.00"),
                PetStatus.AVAILABLE,
                null,
                null
        );

        Set<ConstraintViolation<PetCreateRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("name"));
    }

    @Test
    @DisplayName("Should fail validation when price is negative")
    void testNegativePrice() {
        PetCreateRequest request = new PetCreateRequest(
                "Bella",
                "Dog",
                "Golden Retriever",
                12,
                new BigDecimal("-10.00"),
                PetStatus.AVAILABLE,
                null,
                null
        );

        Set<ConstraintViolation<PetCreateRequest>> violations = validator.validate(request);
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("price"));
    }
}
