package com.kozimor.wms.Database.Model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "items",
       indexes = {
           @Index(name = "idx_items_category", columnList = "category_id"),
           @Index(name = "idx_items_qr", columnList = "qr_code")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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

    @Column(name = "unit", length = 20)
    private String unit; // JEDNOSTKA MIARY, e.g., pcs, kg, liters

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
}
