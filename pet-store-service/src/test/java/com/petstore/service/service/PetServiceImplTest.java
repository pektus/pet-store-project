package com.petstore.service.service;

import com.petstore.domain.dto.PetCreateRequest;
import com.petstore.domain.dto.PetDetailDTO;
import com.petstore.domain.entity.Category;
import com.petstore.domain.entity.Pet;
import com.petstore.domain.entity.PetStatusAudit;
import com.petstore.domain.enums.PetStatus;
import com.petstore.service.exception.InvalidStateTransitionException;
import com.petstore.service.exception.ResourceNotFoundException;
import com.petstore.service.mapper.PetMapper;
import com.petstore.service.repository.CategoryRepository;
import com.petstore.service.repository.PetRepository;
import com.petstore.service.repository.PetStatusAuditRepository;
import com.petstore.service.service.impl.PetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PetServiceImplTest {

    @Mock
    private PetRepository petRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private PetStatusAuditRepository auditRepository;

    @Mock
    private StorageService storageService;

    @Spy
    private PetMapper petMapper;

    @InjectMocks
    private PetServiceImpl petService;

    private Category dogCategory;
    private Pet samplePet;

    @BeforeEach
    void setUp() {
        dogCategory = new Category("Dog", "Canines", 1);
        dogCategory.setId(1L);

        samplePet = new Pet(
                dogCategory,
                "Rocky",
                "German Shepherd",
                24,
                new BigDecimal("500.00"),
                PetStatus.AVAILABLE,
                "Loyal and active",
                "/api/media/photo.jpg"
        );
        samplePet.setId(10L);
    }

    @Test
    @DisplayName("Should create pet and record audit entry")
    void testCreatePet() {
        PetCreateRequest request = new PetCreateRequest(
                "Rocky",
                "Dog",
                "German Shepherd",
                24,
                new BigDecimal("500.00"),
                PetStatus.AVAILABLE,
                "Loyal and active",
                "/api/media/photo.jpg"
        );

        when(categoryRepository.findByNameIgnoreCase("Dog")).thenReturn(Optional.of(dogCategory));
        when(petRepository.save(any(Pet.class))).thenAnswer(invocation -> {
            Pet p = invocation.getArgument(0);
            p.setId(10L);
            return p;
        });

        PetDetailDTO result = petService.createPet(request);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(10L);
        assertThat(result.name()).isEqualTo("Rocky");
        verify(auditRepository, times(1)).save(any(PetStatusAudit.class));
    }

    @Test
    @DisplayName("Should transition status from AVAILABLE to PENDING")
    void testTransitionAvailableToPending() {
        when(petRepository.findById(10L)).thenReturn(Optional.of(samplePet));
        when(petRepository.save(any(Pet.class))).thenAnswer(inv -> inv.getArgument(0));

        PetDetailDTO result = petService.updatePetStatus(10L, PetStatus.PENDING, "admin");

        assertThat(result.status()).isEqualTo(PetStatus.PENDING);
        verify(auditRepository, times(1)).save(any(PetStatusAudit.class));
    }

    @Test
    @DisplayName("Should reject illegal status transition from ADOPTED to AVAILABLE")
    void testRejectAdoptedToAvailable() {
        samplePet.setStatus(PetStatus.ADOPTED);
        when(petRepository.findById(10L)).thenReturn(Optional.of(samplePet));

        assertThatThrownBy(() -> petService.updatePetStatus(10L, PetStatus.AVAILABLE, "admin"))
                .isInstanceOf(InvalidStateTransitionException.class)
                .hasMessageContaining("Cannot transition status from ADOPTED to AVAILABLE");

        verify(petRepository, never()).save(any(Pet.class));
    }

    @Test
    @DisplayName("Should delete pet and clean up media file")
    void testDeletePetCleansUpMedia() {
        when(petRepository.findById(10L)).thenReturn(Optional.of(samplePet));

        petService.deletePet(10L);

        verify(storageService, times(1)).delete("photo.jpg");
        verify(petRepository, times(1)).delete(samplePet);
    }

    @Test
    @DisplayName("Should return distinct breeds scoped by category")
    void testGetBreedsScopedByCategory() {
        when(petRepository.findDistinctBreedsByCategory("Dog"))
                .thenReturn(java.util.List.of("Beagle", "German Shepherd", "Golden Retriever"));

        java.util.List<String> breeds = petService.getBreeds("Dog");

        assertThat(breeds).containsExactly("Beagle", "German Shepherd", "Golden Retriever");
        verify(petRepository, times(1)).findDistinctBreedsByCategory("Dog");
        verify(petRepository, never()).findDistinctBreeds();
    }

    @Test
    @DisplayName("Should return all distinct breeds when category is null or blank")
    void testGetBreedsUnscoped() {
        when(petRepository.findDistinctBreeds())
                .thenReturn(java.util.List.of("Beagle", "Persian", "Siamese"));

        java.util.List<String> breedsNull = petService.getBreeds(null);
        java.util.List<String> breedsBlank = petService.getBreeds("   ");

        assertThat(breedsNull).containsExactly("Beagle", "Persian", "Siamese");
        assertThat(breedsBlank).containsExactly("Beagle", "Persian", "Siamese");
        verify(petRepository, times(2)).findDistinctBreeds();
    }

    @Test
    @DisplayName("Should return list of category names ordered by display order")
    void testGetCategories() {
        Category cat1 = new Category("Dog", null, 1);
        Category cat2 = new Category("Cat", null, 2);
        when(categoryRepository.findAllByOrderByDisplayOrderAsc())
                .thenReturn(java.util.List.of(cat1, cat2));

        java.util.List<String> categories = petService.getCategories();

        assertThat(categories).containsExactly("Dog", "Cat");
    }
}

