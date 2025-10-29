package com.kozimor.wms.Database.Model.DTO;

import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportDTO {
    private Long id;
    private Integer totalItemsCount;
    private Integer lowStockCount;
    private Integer criticalStockCount;
    private Integer okCount;
    private UserDTO createdBy;
    private Set<ReportItemDTO> reportItems;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
