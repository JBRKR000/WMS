package com.kozimor.wms.Database.Service;

import com.kozimor.wms.Database.Model.Location;
import com.kozimor.wms.Database.Model.LocationThreshold;
import com.kozimor.wms.Database.Repository.LocationRepository;
import com.kozimor.wms.Database.Repository.LocationThresholdRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@AllArgsConstructor
public class LocationThresholdService {
    
    private final LocationThresholdRepository locationThresholdRepository;
    private final LocationRepository locationRepository;
    
    /**
     * Pobierz threshold dla danej lokacji
     */
    public LocationThreshold getByLocationId(Long locationId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Lokacja nie znaleziona"));
        
        return locationThresholdRepository.findByLocation(location)
                .orElseThrow(() -> new IllegalArgumentException("Threshold dla tej lokacji nie znaleziony"));
    }
    
    /**
     * Utwórz nowy threshold z mapy zawierającej locationId
     */
    public LocationThreshold createFromMap(Map<String, Object> data) {
        if (data.get("locationId") == null) {
            throw new IllegalArgumentException("Lokacja jest wymagana");
        }
        
        Long locationId = ((Number) data.get("locationId")).longValue();
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Lokacja nie znaleziona"));
        
        // Sprawdź czy już istnieje threshold dla tej lokacji
        if (locationThresholdRepository.findByLocation(location).isPresent()) {
            throw new IllegalArgumentException("Threshold dla tej lokacji już istnieje");
        }
        
        LocationThreshold threshold = new LocationThreshold();
        threshold.setLocation(location);
        threshold.setMinThreshold(((Number) data.get("minThreshold")).intValue());
        threshold.setMaxThreshold(((Number) data.get("maxThreshold")).intValue());
        
        return locationThresholdRepository.save(threshold);
    }
    
    /**
     * Utwórz nowy threshold
     */
    public LocationThreshold create(LocationThreshold threshold) {
        if (threshold.getLocation() == null || threshold.getLocation().getId() == null) {
            throw new IllegalArgumentException("Lokacja jest wymagana");
        }
        
        Location location = locationRepository.findById(threshold.getLocation().getId())
                .orElseThrow(() -> new IllegalArgumentException("Lokacja nie znaleziona"));
        
        threshold.setLocation(location);
        
        // Sprawdź czy już istnieje threshold dla tej lokacji
        if (locationThresholdRepository.findByLocation(location).isPresent()) {
            throw new IllegalArgumentException("Threshold dla tej lokacji już istnieje");
        }
        
        return locationThresholdRepository.save(threshold);
    }
    
    /**
     * Aktualizuj threshold
     */
    public LocationThreshold update(Long id, LocationThreshold thresholdData) {
        LocationThreshold existing = locationThresholdRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Threshold nie znaleziony"));
        
        if (thresholdData.getMinThreshold() >= 0) {
            existing.setMinThreshold(thresholdData.getMinThreshold());
        }
        if (thresholdData.getMaxThreshold() > 0) {
            existing.setMaxThreshold(thresholdData.getMaxThreshold());
        }
        
        return locationThresholdRepository.save(existing);
    }
    
    /**
     * Usuń threshold
     */
    public void delete(Long id) {
        LocationThreshold threshold = locationThresholdRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Threshold nie znaleziony"));
        
        locationThresholdRepository.delete(threshold);
    }
}
