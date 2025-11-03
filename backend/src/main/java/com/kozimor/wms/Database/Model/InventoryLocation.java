package com.kozimor.wms.Database.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_locations",
       indexes = {
           @Index(name = "idx_inventory_locations_item", columnList = "item_id"),
           @Index(name = "idx_inventory_locations_location", columnList = "location_id"),
           @Index(name = "idx_inventory_locations_item_location", columnList = "item_id,location_id")
       },
       uniqueConstraints = @UniqueConstraint(columnNames = {"item_id", "location_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventoryLocation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
