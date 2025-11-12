package com.kozimor.wms.Database.Model.DTO;

import com.kozimor.wms.Database.Model.UnitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationDTO {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String type;
    @Builder.Default
    private UnitType unitType = UnitType.PCS;
    @Builder.Default
    private boolean active = true;
}
