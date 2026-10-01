package com.petstore.service.service.impl;

import com.petstore.domain.dto.*;
import com.petstore.domain.entity.Category;
import com.petstore.domain.entity.Pet;
import com.petstore.domain.entity.PetStatusAudit;
import com.petstore.domain.enums.PetStatus;
import com.petstore.service.exception.InvalidStateTransitionException;
import com.petstore.service.exception.ResourceNotFoundException;
import com.petstore.service.mapper.PetMapper;
import com.petstore.service.repository.CategoryRepository;
import com.petstore.service.repository.PetRepository;
import com.petstore.service.repository.PetSpecification;
import com.petstore.service.repository.PetStatusAuditRepository;
import com.petstore.service.service.PetService;
import com.petstore.service.service.StorageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class PetServiceImpl implements PetService {

    private final PetRepository petRepository;
    private final CategoryRepository categoryRepository;
    private final PetStatusAuditRepository auditRepository;
    private final PetMapper petMapper;
    private final StorageService storageService;

    public PetServiceImpl(PetRepository petRepository,
                          CategoryRepository categoryRepository,
                          PetStatusAuditRepository auditRepository,
                          PetMapper petMapper,
                          StorageService storageService) {
        this.petRepository = petRepository;
        this.categoryRepository = categoryRepository;
        this.auditRepository = auditRepository;
        this.petMapper = petMapper;
        this.storageService = storageService;
    }

    @Override
    public PageResponse<PetSummaryDTO> getPets(
            String search,
            String category,
            String breed,
            PetStatus status,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Pageable pageable) {

        Page<Pet> page = petRepository.findAll(
                PetSpecification.filterPets(search, category, breed, status, minPrice, maxPrice),
                pageable
        );

        List<PetSummaryDTO> summaries = page.getContent().stream()
                .map(petMapper::toSummaryDTO)
                .toList();

        return new PageResponse<>(
                summaries,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    @Override
    public PetDetailDTO getPetById(Long id) {
        Pet pet = petRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pet with ID " + id + " does not exist"));
        return petMapper.toDetailDTO(pet);
    }

    @Override
    @Transactional
    public PetDetailDTO createPet(PetCreateRequest request) {
        Category category = resolveCategory(request.category());
        Pet pet = petMapper.toEntity(request, category);
        Pet savedPet = petRepository.save(pet);

        // Record initial status audit
        PetStatusAudit audit = new PetStatusAudit(savedPet, null, savedPet.getStatus(), "SYSTEM");
        auditRepository.save(audit);

        return petMapper.toDetailDTO(savedPet);
    }

    @Override
    @Transactional
    public PetDetailDTO updatePet(Long id, PetUpdateRequest request) {
        Pet pet = petRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pet with ID " + id + " does not exist"));

        // If photo changed, clean up obsolete photo
        if (pet.getPhotoUrl() != null && !pet.getPhotoUrl().equals(request.photoUrl())) {
            cleanupMediaFile(pet.getPhotoUrl());
        }

        Category category = resolveCategory(request.category());
        PetStatus previousStatus = pet.getStatus();

        petMapper.updateEntity(pet, request, category);
        Pet updatedPet = petRepository.save(pet);

        // Record audit if status changed during edit
        if (previousStatus != updatedPet.getStatus()) {
            auditRepository.save(new PetStatusAudit(updatedPet, previousStatus, updatedPet.getStatus(), "ADMIN"));
        }

        return petMapper.toDetailDTO(updatedPet);
    }

    @Override
    @Transactional
    public PetDetailDTO updatePetStatus(Long id, PetStatus newStatus, String changedBy) {
        Pet pet = petRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pet with ID " + id + " does not exist"));

        PetStatus currentStatus = pet.getStatus();
        if (currentStatus == newStatus) {
            return petMapper.toDetailDTO(pet);
        }

        // Validate lifecycle transition rules
        if (currentStatus == PetStatus.ADOPTED && newStatus == PetStatus.AVAILABLE) {
            throw new InvalidStateTransitionException("Cannot transition status from ADOPTED to AVAILABLE without supervisor override");
        }

        pet.setStatus(newStatus);
        Pet savedPet = petRepository.save(pet);

        PetStatusAudit audit = new PetStatusAudit(savedPet, currentStatus, newStatus, changedBy != null ? changedBy : "ADMIN");
        auditRepository.save(audit);

        return petMapper.toDetailDTO(savedPet);
    }

    @Override
    @Transactional
    public void deletePet(Long id) {
        Pet pet = petRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pet with ID " + id + " does not exist"));

        // Clean up filesystem media asset
        if (pet.getPhotoUrl() != null) {
            cleanupMediaFile(pet.getPhotoUrl());
        }

        petRepository.delete(pet);
    }

    @Override
    public List<String> getCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(Category::getName)
                .toList();
    }

    @Override
    public List<String> getBreeds(String category) {
        if (category != null && !category.trim().isEmpty()) {
            return petRepository.findDistinctBreedsByCategory(category.trim());
        }
        return petRepository.findDistinctBreeds();
    }

    private Category resolveCategory(String categoryName) {
        return categoryRepository.findByNameIgnoreCase(categoryName.trim())
                .orElseGet(() -> categoryRepository.save(new Category(categoryName.trim(), null, 99)));
    }

    private void cleanupMediaFile(String photoUrl) {
        if (photoUrl != null && photoUrl.startsWith("/api/media/")) {
            String filename = photoUrl.substring("/api/media/".length());
            storageService.delete(filename);
        }
    }
}
