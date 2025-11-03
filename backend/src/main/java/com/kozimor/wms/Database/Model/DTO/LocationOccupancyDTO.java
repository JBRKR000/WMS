package com.kozimor.wms.Database.Model.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationOccupancyDTO {
    private Long locationId;
    private String locationCode;
    private String locationName;
    private String locationDescription;
    private int maxCapacity;
    private int minThreshold;
    private int currentOccupancy;
    private double occupancyPercentage; // 0-100
    private int itemCount;
    private boolean isAboveThreshold; // Czy powyżej minimalnego progu
    private boolean isActive;
}
