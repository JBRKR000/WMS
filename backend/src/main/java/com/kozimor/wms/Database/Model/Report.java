package com.kozimor.wms.Database.Model;

import jakarta.persistence.*;
import lombok.*;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "reports", indexes = {
        @Index(name = "idx_reports_user", columnList = "created_by")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long id;

    @Column(name = "total_items_count", nullable = false)
    private Integer totalItemsCount; // ŁĄCZNA LICZBA WSZYSTKICH ITEMÓW W MAGAZYNIE

    @Column(name = "low_stock_count", nullable = false)
    private Integer lowStockCount; // LICZBA POZYCJI Z NISKIM STANEM

    @Column(name = "critical_stock_count", nullable = false)
    private Integer criticalStockCount; // LICZBA POZYCJI Z KRYTYCZNYM STANEM

    @Column(name = "ok_count", nullable = false)
    private Integer okCount; // LICZBA POZYCJI OK

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy; // CREATED_BY

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<ReportItem> reportItems = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
