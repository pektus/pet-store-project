package com.petstore.service.repository;

import com.petstore.domain.entity.Pet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PetRepository extends JpaRepository<Pet, Long>, JpaSpecificationExecutor<Pet> {

    @Query("SELECT DISTINCT p.breed FROM Pet p ORDER BY p.breed ASC")
    List<String> findDistinctBreeds();

    @Query("SELECT DISTINCT p.breed FROM Pet p WHERE LOWER(p.category.name) = LOWER(:category) ORDER BY p.breed ASC")
    List<String> findDistinctBreedsByCategory(@Param("category") String category);
}
