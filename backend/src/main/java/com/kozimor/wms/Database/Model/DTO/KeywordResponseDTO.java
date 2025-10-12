package com.kozimor.wms.Database.Model.DTO;

import com.kozimor.wms.Database.Model.Keyword;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KeywordResponseDTO {
    private Long id;
    private String value;
    private int itemsCount;
    
    public static KeywordResponseDTO fromKeyword(Keyword keyword) {
        return new KeywordResponseDTO(
            keyword.getId(),
            keyword.getValue(),
            keyword.getItems() != null ? keyword.getItems().size() : 0
        );
    }
}
