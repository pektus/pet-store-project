package com.petstore.service.mapper;

import com.petstore.domain.dto.PetCreateRequest;
import com.petstore.domain.dto.PetDetailDTO;
import com.petstore.domain.dto.PetSummaryDTO;
import com.petstore.domain.dto.PetUpdateRequest;
import com.petstore.domain.entity.Category;
import com.petstore.domain.entity.Pet;
import org.springframework.stereotype.Component;

@Component
public class PetMapper {

    public PetSummaryDTO toSummaryDTO(Pet pet) {
        if (pet == null) {
            return null;
        }
        return new PetSummaryDTO(
                pet.getId(),
                pet.getName(),
                pet.getCategory() != null ? pet.getCategory().getName() : null,
                pet.getBreed(),
                pet.getAgeMonths(),
                pet.getPrice(),
                pet.getStatus(),
                pet.getPhotoUrl(),
                pet.getCreatedAt()
        );
    }

    public PetDetailDTO toDetailDTO(Pet pet) {
        if (pet == null) {
            return null;
        }
        return new PetDetailDTO(
                pet.getId(),
                pet.getName(),
                pet.getCategory() != null ? pet.getCategory().getName() : null,
                pet.getBreed(),
                pet.getAgeMonths(),
                pet.getPrice(),
                pet.getStatus(),
                pet.getDescription(),
                pet.getPhotoUrl(),
                pet.getCreatedAt(),
                pet.getUpdatedAt()
        );
    }

    public Pet toEntity(PetCreateRequest request, Category category) {
        if (request == null) {
            return null;
        }
        return new Pet(
                category,
                request.name(),
                request.breed(),
                request.ageMonths(),
                request.price(),
                request.status(),
                request.description(),
                request.photoUrl()
        );
    }

    public void updateEntity(Pet pet, PetUpdateRequest request, Category category) {
        if (pet == null || request == null) {
            return;
        }
        pet.setName(request.name());
        pet.setBreed(request.breed());
        pet.setAgeMonths(request.ageMonths());
        pet.setPrice(request.price());
        pet.setStatus(request.status());
        pet.setDescription(request.description());
        pet.setPhotoUrl(request.photoUrl());
        pet.setCategory(category);
    }
}
