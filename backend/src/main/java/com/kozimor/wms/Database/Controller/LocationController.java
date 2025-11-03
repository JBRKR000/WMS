package com.kozimor.wms.Database.Controller;

import com.kozimor.wms.Database.Model.DTO.LocationOccupancyDTO;
import com.kozimor.wms.Database.Model.DTO.LocationDTO;
import com.kozimor.wms.Database.Model.InventoryLocation;
import com.kozimor.wms.Database.Model.Location;
import com.kozimor.wms.Database.Service.LocationService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/locations")
@AllArgsConstructor
public class LocationController {
    
    private final LocationService locationService;
    
    /**
     * Pobierz wszystkie lokacje
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('WAREHOUSE', 'ADMIN')")
    public ResponseEntity<?> getAllLocations() {
        try {
            List<Location> locations = locationService.getAll();
            List<LocationDTO> dtos = locations.stream()
                    .map(loc -> LocationDTO.builder()
                            .id(loc.getId())
                            .code(loc.getCode())
                            .name(loc.getName())
                            .description(loc.getDescription())
                            .type(loc.getType())
                            .active(loc.isActive())
                            .build())
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Błąd przy pobieraniu lokacji"));
        }
    }
    
    /**
     * Pobierz lokację po ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('WAREHOUSE', 'ADMIN')")
    public ResponseEntity<?> getLocationById(@PathVariable Long id) {
        try {
            Location location = locationService.getById(id);
            LocationDTO dto = LocationDTO.builder()
                    .id(location.getId())
                    .code(location.getCode())
                    .name(location.getName())
                    .description(location.getDescription())
                    .type(location.getType())
                    .active(location.isActive())
                    .build();
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Utwórz nową lokację
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<?> createLocation(@RequestBody Location location) {
        try {
            // Walidacja wymaganych pól
            if (location.getCode() == null || location.getCode().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Kod lokacji jest wymagany"));
            }
            if (location.getName() == null || location.getName().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Nazwa lokacji jest wymagana"));
            }
            if (location.getType() == null || location.getType().isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Typ lokacji jest wymagany"));
            }
            
            Location created = locationService.create(location);
            LocationDTO dto = LocationDTO.builder()
                    .id(created.getId())
                    .code(created.getCode())
                    .name(created.getName())
                    .description(created.getDescription())
                    .type(created.getType())
                    .active(created.isActive())
                    .build();
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Kod lokacji już istnieje"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Błąd przy tworzeniu lokacji: " + e.getMessage()));
        }
    }
    
    /**
     * Aktualizuj lokację
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<?> updateLocation(@PathVariable Long id, @RequestBody Location location) {
        try {
            Location updated = locationService.update(id, location);
            LocationDTO dto = LocationDTO.builder()
                    .id(updated.getId())
                    .code(updated.getCode())
                    .name(updated.getName())
                    .description(updated.getDescription())
                    .type(updated.getType())
                    .active(updated.isActive())
                    .build();
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Usuń lokację
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<?> deleteLocation(@PathVariable Long id) {
        try {
            locationService.delete(id);
            return ResponseEntity.ok(Map.of("message", "Lokacja usunięta pomyślnie"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Pobierz informacje o obłożeniu danej lokacji
     */
    @GetMapping("/{id}/occupancy")
    public ResponseEntity<?> getLocationOccupancy(@PathVariable Long id) {
        try {
            LocationOccupancyDTO occupancy = locationService.getLocationOccupancy(id);
            return ResponseEntity.ok(occupancy);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Pobierz ilość itemów w danej lokacji
     */
    @GetMapping("/{id}/item-count")
    public ResponseEntity<?> getItemCount(@PathVariable Long id) {
        try {
            int count = locationService.getItemCountInLocation(id);
            return ResponseEntity.ok(Map.of(
                    "locationId", id,
                    "itemCount", count
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Pobierz wszystkie itemy w danej lokacji
     */
    @GetMapping("/{id}/items")
    public ResponseEntity<?> getItemsInLocation(@PathVariable Long id) {
        try {
            List<InventoryLocation> items = locationService.getItemsInLocation(id);
            return ResponseEntity.ok(Map.of(
                    "locationId", id,
                    "items", items,
                    "count", items.size()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Sprawdź czy w lokacji jest miejsce dla nowego itemu
     */
    @PostMapping("/{locationId}/check-capacity")
    public ResponseEntity<?> checkCapacity(
            @PathVariable Long locationId,
            @RequestParam Long itemId
    ) {
        try {
            boolean canAdd = locationService.canAddItem(locationId, itemId);
            
            return ResponseEntity.ok(Map.of(
                    "locationId", locationId,
                    "itemId", itemId,
                    "canAdd", canAdd,
                    "message", canAdd ? "Jest miejsce w lokacji" : "Brak miejsca w lokacji"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Pobierz całkowitą ilość itemu w danej lokacji (z transakcji)
     */
    @GetMapping("/{locationId}/item/{itemId}/quantity")
    public ResponseEntity<?> getTotalQuantity(
            @PathVariable Long locationId,
            @PathVariable Long itemId
    ) {
        try {
            int quantity = locationService.getTotalQuantityInLocation(itemId, locationId);
            
            return ResponseEntity.ok(Map.of(
                    "locationId", locationId,
                    "itemId", itemId,
                    "totalQuantity", quantity
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Sprawdź czy ilość itemu w lokacji jest poniżej minimum
     */
    @GetMapping("/{locationId}/item/{itemId}/below-threshold")
    public ResponseEntity<?> isBelowThreshold(
            @PathVariable Long locationId,
            @PathVariable Long itemId
    ) {
        try {
            boolean isBelowMin = locationService.isBelowMinThreshold(locationId, itemId);
            
            return ResponseEntity.ok(Map.of(
                    "locationId", locationId,
                    "itemId", itemId,
                    "isBelowMinThreshold", isBelowMin,
                    "message", isBelowMin ? "Ilość poniżej minimum!" : "Ilość w normie"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Dodaj item do lokacji (powiązanie)
     */
    @PostMapping("/{locationId}/add-item/{itemId}")
    @PreAuthorize("hasAnyRole('WAREHOUSE', 'ADMIN')")
    public ResponseEntity<?> addItemToLocation(
            @PathVariable Long locationId,
            @PathVariable Long itemId
    ) {
        try {
            InventoryLocation result = locationService.addItemToLocation(locationId, itemId);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "message", "Item dodany do lokacji",
                    "inventoryLocation", result
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Usuń item z lokacji
     */
    @DeleteMapping("/{locationId}/remove-item/{itemId}")
    @PreAuthorize("hasAnyRole('WAREHOUSE', 'ADMIN')")
    public ResponseEntity<?> removeItemFromLocation(
            @PathVariable Long locationId,
            @PathVariable Long itemId
    ) {
        try {
            locationService.removeItemFromLocation(locationId, itemId);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Item usunięty z lokacji",
                    "locationId", locationId,
                    "itemId", itemId
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
