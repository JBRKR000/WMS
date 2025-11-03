package com.kozimor.wms.Database.Controller;

import com.kozimor.wms.Database.Model.LocationThreshold;
import com.kozimor.wms.Database.Service.LocationThresholdService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/location-thresholds")
@AllArgsConstructor
public class LocationThresholdController {
    
    private final LocationThresholdService locationThresholdService;
    
    /**
     * Pobierz threshold dla danej lokacji
     */
    @GetMapping("/location/{locationId}")
    @PreAuthorize("hasAnyRole('WAREHOUSE', 'ADMIN')")
    public ResponseEntity<?> getThresholdByLocation(@PathVariable Long locationId) {
        try {
            LocationThreshold threshold = locationThresholdService.getByLocationId(locationId);
            return ResponseEntity.ok(threshold);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Utwórz nowy threshold
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<?> createThreshold(@RequestBody Map<String, Object> thresholdData) {
        try {
            if (thresholdData.get("locationId") == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Lokacja jest wymagana"));
            }
            
            int minThreshold = ((Number) thresholdData.get("minThreshold")).intValue();
            int maxThreshold = ((Number) thresholdData.get("maxThreshold")).intValue();
            
            if (minThreshold < 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Minimalny próg nie może być ujemny"));
            }
            if (maxThreshold <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Maksymalny próg musi być większy od zera"));
            }
            if (minThreshold >= maxThreshold) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Minimalny próg musi być mniejszy od maksymalnego"));
            }
            
            LocationThreshold created = locationThresholdService.createFromMap(thresholdData);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Błąd przy tworzeniu thresholdu: " + e.getMessage()));
        }
    }
    
    /**
     * Aktualizuj threshold
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<?> updateThreshold(@PathVariable Long id, @RequestBody LocationThreshold threshold) {
        try {
            if (threshold.getMinThreshold() < 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Minimalny próg nie może być ujemny"));
            }
            if (threshold.getMaxThreshold() <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Maksymalny próg musi być większy od zera"));
            }
            if (threshold.getMinThreshold() >= threshold.getMaxThreshold()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Minimalny próg musi być mniejszy od maksymalnego"));
            }
            
            LocationThreshold updated = locationThresholdService.update(id, threshold);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Błąd przy aktualizacji thresholdu"));
        }
    }
    
    /**
     * Usuń threshold
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<?> deleteThreshold(@PathVariable Long id) {
        try {
            locationThresholdService.delete(id);
            return ResponseEntity.ok(Map.of("message", "Threshold usunięty pomyślnie"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
