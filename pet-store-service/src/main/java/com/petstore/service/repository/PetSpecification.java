package com.petstore.service.repository;

import com.petstore.domain.entity.Pet;
import com.petstore.domain.enums.PetStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public final class PetSpecification {

    private PetSpecification() {
    }

    public static Specification<Pet> filterPets(
            String search,
            String category,
            String breed,
            PetStatus status,
            BigDecimal minPrice,
            BigDecimal maxPrice) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Case-insensitive search on name, breed, or description
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern);
                Predicate breedMatch = cb.like(cb.lower(root.get("breed")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(nameMatch, breedMatch, descMatch));
            }

            // Category filter
            if (category != null && !category.trim().isEmpty()) {
                predicates.add(cb.equal(
                        cb.lower(root.join("category").get("name")),
                        category.trim().toLowerCase()
                ));
            }

            // Breed filter
            if (breed != null && !breed.trim().isEmpty()) {
                predicates.add(cb.equal(
                        cb.lower(root.get("breed")),
                        breed.trim().toLowerCase()
                ));
            }

            // Status filter
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // Min Price
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }

            // Max Price
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
