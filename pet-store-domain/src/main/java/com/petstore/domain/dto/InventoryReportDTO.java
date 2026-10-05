package com.petstore.domain.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class InventoryReportDTO {

    private long totalPets;
    private long availablePets;
    private long adoptedPets;
    private long totalSupplySkus;
    private long inStockSuppliesCount;
    private long lowStockSuppliesCount;
    private long outOfStockSuppliesCount;
    private long totalSuppliesStockUnits;
    private BigDecimal totalSuppliesValuation = BigDecimal.ZERO;
    private List<LowStockAlertDTO> lowStockAlerts = new ArrayList<>();
    private List<PetCategoryBreakdownDTO> petCategoryBreakdown = new ArrayList<>();

    public InventoryReportDTO() {
    }

    public InventoryReportDTO(long totalPets, long availablePets, long adoptedPets,
                              long totalSupplySkus, long inStockSuppliesCount, long lowStockSuppliesCount,
                              long outOfStockSuppliesCount, long totalSuppliesStockUnits,
                              BigDecimal totalSuppliesValuation, List<LowStockAlertDTO> lowStockAlerts,
                              List<PetCategoryBreakdownDTO> petCategoryBreakdown) {
        this.totalPets = totalPets;
        this.availablePets = availablePets;
        this.adoptedPets = adoptedPets;
        this.totalSupplySkus = totalSupplySkus;
        this.inStockSuppliesCount = inStockSuppliesCount;
        this.lowStockSuppliesCount = lowStockSuppliesCount;
        this.outOfStockSuppliesCount = outOfStockSuppliesCount;
        this.totalSuppliesStockUnits = totalSuppliesStockUnits;
        this.totalSuppliesValuation = totalSuppliesValuation != null ? totalSuppliesValuation : BigDecimal.ZERO;
        this.lowStockAlerts = lowStockAlerts != null ? lowStockAlerts : new ArrayList<>();
        this.petCategoryBreakdown = petCategoryBreakdown != null ? petCategoryBreakdown : new ArrayList<>();
    }

    public long getTotalPets() {
        return totalPets;
    }

    public void setTotalPets(long totalPets) {
        this.totalPets = totalPets;
    }

    public long getAvailablePets() {
        return availablePets;
    }

    public void setAvailablePets(long availablePets) {
        this.availablePets = availablePets;
    }

    public long getAdoptedPets() {
        return adoptedPets;
    }

    public void setAdoptedPets(long adoptedPets) {
        this.adoptedPets = adoptedPets;
    }

    public long getTotalSupplySkus() {
        return totalSupplySkus;
    }

    public void setTotalSupplySkus(long totalSupplySkus) {
        this.totalSupplySkus = totalSupplySkus;
    }

    public long getInStockSuppliesCount() {
        return inStockSuppliesCount;
    }

    public void setInStockSuppliesCount(long inStockSuppliesCount) {
        this.inStockSuppliesCount = inStockSuppliesCount;
    }

    public long getLowStockSuppliesCount() {
        return lowStockSuppliesCount;
    }

    public void setLowStockSuppliesCount(long lowStockSuppliesCount) {
        this.lowStockSuppliesCount = lowStockSuppliesCount;
    }

    public long getOutOfStockSuppliesCount() {
        return outOfStockSuppliesCount;
    }

    public void setOutOfStockSuppliesCount(long outOfStockSuppliesCount) {
        this.outOfStockSuppliesCount = outOfStockSuppliesCount;
    }

    public long getTotalSuppliesStockUnits() {
        return totalSuppliesStockUnits;
    }

    public void setTotalSuppliesStockUnits(long totalSuppliesStockUnits) {
        this.totalSuppliesStockUnits = totalSuppliesStockUnits;
    }

    public BigDecimal getTotalSuppliesValuation() {
        return totalSuppliesValuation;
    }

    public void setTotalSuppliesValuation(BigDecimal totalSuppliesValuation) {
        this.totalSuppliesValuation = totalSuppliesValuation;
    }

    public List<LowStockAlertDTO> getLowStockAlerts() {
        return lowStockAlerts;
    }

    public void setLowStockAlerts(List<LowStockAlertDTO> lowStockAlerts) {
        this.lowStockAlerts = lowStockAlerts;
    }

    public List<PetCategoryBreakdownDTO> getPetCategoryBreakdown() {
        return petCategoryBreakdown;
    }

    public void setPetCategoryBreakdown(List<PetCategoryBreakdownDTO> petCategoryBreakdown) {
        this.petCategoryBreakdown = petCategoryBreakdown;
    }
}
