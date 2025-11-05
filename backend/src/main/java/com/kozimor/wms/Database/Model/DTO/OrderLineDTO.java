package com.kozimor.wms.Database.Model.DTO;

import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Getter
@Setter
public class OrderLineDTO {
    private Long id;
    private Long itemId;
    private String itemName;
    private String itemCategory;
    private Integer quantity;
    private String unit;
    private Long transactionId;
}
