package com.petstore.service.repository;

import com.petstore.domain.entity.Supply;
import com.petstore.domain.enums.SupplyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplyRepository extends JpaRepository<Supply, Long>, JpaSpecificationExecutor<Supply> {

    Optional<Supply> findBySku(String sku);

    boolean existsBySku(String sku);

    boolean existsBySkuAndIdNot(String sku, Long id);

    List<Supply> findByStatusAndStockQuantityLessThanEqual(SupplyStatus status, Integer threshold);
}
