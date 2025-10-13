package com.kozimor.wms.Database.Model.DTO;


import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class ItemDTO {
    private Long id;
    private String name;
    private String description;
    private String categoryName;
    private String unit;
    private Integer currentQuantity;
    private String qrCode;
    private String createdAt;
    private String updatedAt;
    private Set<String> keywords;
}
