package com.petstore.service.repository;

import com.petstore.domain.entity.PetStatusAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PetStatusAuditRepository extends JpaRepository<PetStatusAudit, Long> {
    List<PetStatusAudit> findByPetIdOrderByChangedAtDesc(Long petId);
}
