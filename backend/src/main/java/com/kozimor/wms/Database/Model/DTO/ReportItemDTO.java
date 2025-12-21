package com.kozimor.wms.Database.Model.DTO;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportItemDTO {
    private Long id;
    private String itemName;
    private String status;
    private Double currentQuantity;
    private String unit;
    private LocalDateTime lastReceiptDate;
    private LocalDateTime lastIssueDate;
    private Double warehouseValue;
    private Integer differenceFromPrevious;
    private String qrCode;
    private LocalDateTime createdAt;
}
