package com.petstore.domain.dto;

public class PetCategoryBreakdownDTO {

    private String category;
    private long total;
    private long available;
    private long adopted;
    private double adoptionRate;

    public PetCategoryBreakdownDTO() {
    }

    public PetCategoryBreakdownDTO(String category, long total, long available, long adopted, double adoptionRate) {
        this.category = category;
        this.total = total;
        this.available = available;
        this.adopted = adopted;
        this.adoptionRate = adoptionRate;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public long getAvailable() {
        return available;
    }

    public void setAvailable(long available) {
        this.available = available;
    }

    public long getAdopted() {
        return adopted;
    }

    public void setAdopted(long adopted) {
        this.adopted = adopted;
    }

    public double getAdoptionRate() {
        return adoptionRate;
    }

    public void setAdoptionRate(double adoptionRate) {
        this.adoptionRate = adoptionRate;
    }
}
