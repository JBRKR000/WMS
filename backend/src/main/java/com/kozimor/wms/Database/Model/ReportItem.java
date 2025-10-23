package com.kozimor.wms.Database.Model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "report_items", indexes = {
        @Index(name = "idx_report_items_report", columnList = "report_id"),
        @Index(name = "idx_report_items_item", columnList = "item_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_item_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private Report report;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(name = "item_name", nullable = false, length = 255)
    private String itemName; // NAZWA ITEMU

    @Column(name = "status", nullable = false, length = 50)
    private String status; // STATUS (np. OK, LOW, CRITICAL)

    @Column(name = "last_receipt_date")
    private LocalDateTime lastReceiptDate; // DATA OSTATNIEGO PRZYJĘCIA

    @Column(name = "last_issue_date")
    private LocalDateTime lastIssueDate; // DATA OSTATNIEGO WYDANIA

    @Column(name = "warehouse_value", nullable = false)
    private Double warehouseValue; // WARTOŚĆ NA MAGAZYNIE

    @Column(name = "difference_from_previous")
    private Integer differenceFromPrevious; // RÓŻNICA MIĘDZY POPRZEDNIM STANEM

    @Enumerated(EnumType.STRING)
    @Column(name = "unit", nullable = false, length = 20)
    private UnitType unit; // JEDNOSTKA

    @Column(name = "qr_code", length = 255)
    private String qrCode; // KOD QR

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
