package com.kozimor.wms.Database.Model.DTO;

import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Getter
@Setter
public class OrderStatusHistoryDTO {
    private Long id;
    private String oldStatus;
    private String newStatus;
    private String changedBy;
    private String changeReason;
    private String createdAt;
}
