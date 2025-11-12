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
public class TransactionDTO {
    private Long id;
    private String transactionDate;
    private String transactionType;
    private String itemName;
    private Integer quantity;
    private String userName;
    private String description;
    private String categoryName;
    private String transactionStatus;
    private String locationCode;
    private String locationName;

}