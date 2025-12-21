package com.kozimor.wms.Database.Model.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Getter
@Setter
public class TransactionForOrderDTO {
    private Long id;
    private String transactionDate;
    private String transactionType;
    private Long itemId;
    private String itemName;
    private Double quantity;
    private Long userId;
    private String userName;
    private String description;
    private String categoryName;
    private String transactionStatus;
}
