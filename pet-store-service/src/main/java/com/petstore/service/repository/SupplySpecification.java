package com.petstore.service.repository;

import com.petstore.domain.entity.Supply;
import com.petstore.domain.enums.SupplyCategory;
import com.petstore.domain.enums.SupplyStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public final class SupplySpecification {

    private SupplySpecification() {}

    public static Specification<Supply> filterSupplies(
            String search,
            SupplyCategory category,
            SupplyStatus status,
            Boolean inStockOnly,
            BigDecimal minPrice,
            BigDecimal maxPrice) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Case-insensitive search on name, sku, or description
            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern);
                Predicate skuMatch = cb.like(cb.lower(root.get("sku")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(nameMatch, skuMatch, descMatch));
            }

            // Category filter
            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }

            // Status filter
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // In stock only filter
            if (Boolean.TRUE.equals(inStockOnly)) {
                predicates.add(cb.greaterThan(root.get("stockQuantity"), 0));
                predicates.add(cb.equal(root.get("status"), SupplyStatus.ACTIVE));
            }

            // Min price
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }

            // Max price
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
