package com.kozimor.wms.Database.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;


@Entity
@Table(name = "items", indexes = {
        @Index(name = "idx_items_category", columnList = "category_id"),
        @Index(name = "idx_items_qr", columnList = "qr_code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Long id;

    @NotBlank
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit", nullable = false, length = 20)
    private UnitType unit;

    @Column(name = "current_quantity", nullable = false)
    private Integer currentQuantity; // AKTUALNA ILOŚĆ

    @Column(name = "qr_code", unique = true, length = 255)
    private String qrCode; // KOD QR

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "item_keywords", joinColumns = @JoinColumn(name = "item_id"), inverseJoinColumns = @JoinColumn(name = "keyword_id"), indexes = {
            @Index(name = "idx_item_keywords_item", columnList = "item_id"),
            @Index(name = "idx_item_keywords_keyword", columnList = "keyword_id") })
    private Set<Keyword> keywords = new HashSet<>();
    
    @OneToMany(mappedBy = "item", cascade = CascadeType.REMOVE, fetch = FetchType.LAZY)
    private Set<InventoryLocation> locations = new HashSet<>();

    @OneToMany(mappedBy = "item", cascade = CascadeType.REMOVE, fetch = FetchType.LAZY)
    private Set<Transaction> transactions = new HashSet<>();
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private ItemType type = ItemType.PRODUCT;
}
