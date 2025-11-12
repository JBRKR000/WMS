package com.kozimor.wms.Database.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.time.LocalDateTime;

@Entity
@Table(name = "location_thresholds", 
       indexes = @Index(name = "idx_location_thresholds_location", columnList = "location_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LocationThreshold {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    @JsonBackReference
    private Location location;

    @Column(nullable = false)
    private double minThreshold; // Minimalna ilość przed alertem (sztuki, kg, litry itd)

    @Column(nullable = false)
    private double maxThreshold; // Maksymalna pojemność

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
