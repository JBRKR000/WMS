package com.kozimor.wms.Database.Model.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationDTO {
    private String code;
    private String name;
    private String description;
    private String type;
    @Builder.Default
    private boolean active = true;
}
