package com.petstore.domain.entity;

import com.petstore.domain.enums.ItemType;
import com.petstore.domain.enums.SupplyCategory;
import com.petstore.domain.enums.SupplyStatus;
import jakarta.persistence.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "supplies")
public class Supply implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String sku;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private SupplyCategory category;

    @Column(nullable = false, precision = 9, scale = 2)
    private BigDecimal price;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 0;

    @Column(name = "low_stock_threshold", nullable = false)
    private Integer lowStockThreshold = 5;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SupplyStatus status = SupplyStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 20)
    private ItemType itemType = ItemType.MULTIPLE;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "photo_url")
    private String photoUrl;

    @Version
    @Column(nullable = false)
    private Long version = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Supply() {
    }

    public Supply(String sku, String name, SupplyCategory category, BigDecimal price,
                  Integer stockQuantity, Integer lowStockThreshold, SupplyStatus status,
                  String description, String photoUrl) {
        this.sku = sku;
        this.name = name;
        this.category = category;
        this.price = price;
        this.stockQuantity = stockQuantity != null ? stockQuantity : 0;
        this.lowStockThreshold = lowStockThreshold != null ? lowStockThreshold : 5;
        this.status = status != null ? status : SupplyStatus.ACTIVE;
        this.itemType = ItemType.MULTIPLE;
        this.description = description;
        this.photoUrl = photoUrl;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.itemType == null) {
            this.itemType = ItemType.MULTIPLE;
        }
        if (this.lowStockThreshold == null) {
            this.lowStockThreshold = 5;
        }
        if (this.stockQuantity == null) {
            this.stockQuantity = 0;
        }
        evaluateStockStatus();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
        evaluateStockStatus();
    }

    public void evaluateStockStatus() {
        if (this.status != SupplyStatus.DISCONTINUED) {
            if (this.stockQuantity <= 0) {
                this.status = SupplyStatus.OUT_OF_STOCK;
            } else if (this.status == SupplyStatus.OUT_OF_STOCK && this.stockQuantity > 0) {
                this.status = SupplyStatus.ACTIVE;
            }
        }
    }

    public boolean isLowStock() {
        return this.stockQuantity > 0 && this.stockQuantity <= this.lowStockThreshold;
    }

    public boolean isOutOfStock() {
        return this.stockQuantity <= 0 || this.status == SupplyStatus.OUT_OF_STOCK;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public SupplyCategory getCategory() {
        return category;
    }

    public void setCategory(SupplyCategory category) {
        this.category = category;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
        evaluateStockStatus();
    }

    public Integer getLowStockThreshold() {
        return lowStockThreshold;
    }

    public void setLowStockThreshold(Integer lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
    }

    public SupplyStatus getStatus() {
        return status;
    }

    public void setStatus(SupplyStatus status) {
        this.status = status;
    }

    public ItemType getItemType() {
        return itemType;
    }

    public void setItemType(ItemType itemType) {
        this.itemType = itemType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Supply supply = (Supply) o;
        return Objects.equals(id, supply.id) || (sku != null && Objects.equals(sku, supply.sku));
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, sku);
    }
}
