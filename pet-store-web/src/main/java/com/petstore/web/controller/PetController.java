package com.petstore.web.controller;

import com.petstore.domain.dto.*;
import com.petstore.domain.enums.PetStatus;
import com.petstore.service.service.PetService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.net.URI;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/pets")
public class PetController {

    private final PetService petService;

    public PetController(PetService petService) {
        this.petService = petService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<PetSummaryDTO>> getPets(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String breed,
            @RequestParam(required = false) PetStatus status,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            Authentication authentication) {

        // If not admin, lock status to AVAILABLE
        boolean isAdmin = authentication != null &&
                authentication.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));

        PetStatus effectiveStatus = isAdmin ? status : (status != null ? status : PetStatus.AVAILABLE);

        Pageable pageable = createPageable(page, size, sort);
        PageResponse<PetSummaryDTO> response = petService.getPets(
                search, category, breed, effectiveStatus, minPrice, maxPrice, pageable
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PetDetailDTO> getPetById(@PathVariable Long id) {
        PetDetailDTO pet = petService.getPetById(id);
        return ResponseEntity.ok(pet);
    }

    @PostMapping
    public ResponseEntity<PetDetailDTO> createPet(@Valid @RequestBody PetCreateRequest request) {
        PetDetailDTO created = petService.createPet(request);
        URI location = URI.create("/api/pets/" + created.id());
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PetDetailDTO> updatePet(@PathVariable Long id,
                                                 @Valid @RequestBody PetUpdateRequest request) {
        PetDetailDTO updated = petService.updatePet(id, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PetDetailDTO> updatePetStatus(@PathVariable Long id,
                                                       @Valid @RequestBody PetStatusUpdateRequest request,
                                                       Principal principal) {
        String actor = principal != null ? principal.getName() : "ADMIN";
        PetDetailDTO updated = petService.updatePetStatus(id, request.status(), actor);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePet(@PathVariable Long id) {
        petService.deletePet(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(petService.getCategories());
    }

    @GetMapping("/breeds")
    public ResponseEntity<List<String>> getBreeds(@RequestParam(required = false) String category) {
        return ResponseEntity.ok(petService.getBreeds(category));
    }

    private Pageable createPageable(int page, int size, String sort) {
        int boundedSize = Math.min(Math.max(1, size), 100);
        int boundedPage = Math.max(0, page);

        Sort sorting = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String property = parts[0].trim();
            Sort.Direction direction = (parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim()))
                    ? Sort.Direction.ASC
                    : Sort.Direction.DESC;
            sorting = Sort.by(direction, property);
        }

        return PageRequest.of(boundedPage, boundedSize, sorting);
    }
}
