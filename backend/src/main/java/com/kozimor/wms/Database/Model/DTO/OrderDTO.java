package com.kozimor.wms.Database.Model.DTO;

import lombok.*;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Getter
@Setter
public class OrderDTO {
    private Long id;
    private String orderNumber;
    private String orderStatus;
    private String createdBy;
    private String description;
    private Integer itemCount;
    private Integer totalQuantity;
    private List<OrderLineDTO> orderLines;
    private String createdAt;
    private String updatedAt;
}
