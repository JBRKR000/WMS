package com.kozimor.wms.Database.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "locations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Location {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code; // np. "A1-S1-R3"

    private String name; // np. "Sektor A, Półka 1, Rząd 3"
    
    private String description;

    @Column(nullable = false)
    private String type; // np. "SECTOR", "SHELF", "BIN" - jako String, bez enum

    @OneToMany(mappedBy = "location", cascade = CascadeType.REMOVE, fetch = FetchType.LAZY)
    private List<InventoryLocation> inventoryLocations;

    @OneToMany(mappedBy = "location", cascade = CascadeType.REMOVE, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<LocationThreshold> thresholds;

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
