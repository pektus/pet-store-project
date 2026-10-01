package com.petstore.service.service;

import com.petstore.domain.dto.*;
import com.petstore.domain.enums.PetStatus;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface PetService {
    PageResponse<PetSummaryDTO> getPets(
            String search,
            String category,
            String breed,
            PetStatus status,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Pageable pageable
    );

    PetDetailDTO getPetById(Long id);

    PetDetailDTO createPet(PetCreateRequest request);

    PetDetailDTO updatePet(Long id, PetUpdateRequest request);

    PetDetailDTO updatePetStatus(Long id, PetStatus newStatus, String changedBy);

    void deletePet(Long id);

    List<String> getCategories();

    List<String> getBreeds(String category);
}
