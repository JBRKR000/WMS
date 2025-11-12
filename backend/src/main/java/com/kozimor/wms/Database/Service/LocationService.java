package com.kozimor.wms.Database.Service;

import com.kozimor.wms.Database.Model.InventoryLocation;
import com.kozimor.wms.Database.Model.Item;
import com.kozimor.wms.Database.Model.Location;
import com.kozimor.wms.Database.Model.LocationThreshold;
import com.kozimor.wms.Database.Model.DTO.LocationOccupancyDTO;
import com.kozimor.wms.Database.Repository.InventoryLocationRepository;
import com.kozimor.wms.Database.Repository.ItemRepository;
import com.kozimor.wms.Database.Repository.LocationRepository;
import com.kozimor.wms.Database.Repository.LocationThresholdRepository;
import com.kozimor.wms.Database.Repository.TransactionRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@AllArgsConstructor
public class LocationService {
    
    private final LocationRepository locationRepository;
    private final LocationThresholdRepository thresholdRepository;
    private final InventoryLocationRepository inventoryLocationRepository;
    private final TransactionRepository transactionRepository;
    private final ItemRepository itemRepository;
    
    /**
     * Pobierz wszystkie lokacje
     */
    @Transactional(readOnly = true)
    public List<Location> getAll() {
        return locationRepository.findAllByActiveTrue();
    }
    
    /**
     * Pobierz lokację po ID
     */
    @Transactional(readOnly = true)
    public Location getById(Long id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lokacja nie znaleziona"));
    }
    
    /**
     * Utwórz nową lokację
     */
    @Transactional
    public Location create(Location location) {
        return locationRepository.save(location);
    }
    
    /**
     * Aktualizuj lokację
     */
    @Transactional
    public Location update(Long id, Location locationData) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lokacja nie znaleziona"));
        
        if (locationData.getCode() != null) location.setCode(locationData.getCode());
        if (locationData.getName() != null) location.setName(locationData.getName());
        if (locationData.getDescription() != null) location.setDescription(locationData.getDescription());
        if (locationData.getType() != null) location.setType(locationData.getType());
        if (locationData.getUnitType() != null) location.setUnitType(locationData.getUnitType());
        location.setActive(locationData.isActive());
        
        return locationRepository.save(location);
    }
    
    /**
     * Usuń lokację
     */
    @Transactional
    public void delete(Long id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lokacja nie znaleziona"));
        locationRepository.delete(location);
    }
    
    /**
     * Pobierz ilość itemów w danej lokacji
     * @param locationId ID lokacji
     * @return liczba unikalnych itemów w lokacji
     */
    public int getItemCountInLocation(Long locationId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Lokacja nie znaleziona"));
        
        return inventoryLocationRepository.countItemsInLocation(location);
    }
    
    /**
     * Pobierz wszystkie itemy w danej lokacji
     */
    @Transactional(readOnly = true)
    public List<InventoryLocation> getItemsInLocation(Long locationId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Lokacja nie znaleziona"));
        
        return inventoryLocationRepository.findAllByLocation(location);
    }
    
    /**
     * Oblicz całkowitą ilość (z wszystkich transakcji) dla itemu w danej lokacji
     * @param itemId ID itemu
     * @param locationId ID lokacji
     * @return całkowita ilość itemu w danej lokacji
     */
    @Transactional(readOnly = true)
    public int getTotalQuantityInLocation(Long itemId, Long locationId) {
        return transactionRepository.sumQuantityByItemAndLocation(itemId, locationId);
    }
    
    /**
     * Sprawdź czy w lokacji jest miejsce dla nowego itemu
     * @param locationId ID lokacji
     * @param itemId ID itemu
     * @return true jeśli jest miejsce, false jeśli nie
     */
    @Transactional(readOnly = true)
    public boolean canAddItem(Long locationId, Long itemId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Lokacja nie znaleziona"));
        
        LocationThreshold threshold = thresholdRepository.findByLocation(location)
                .orElseThrow(() -> new IllegalArgumentException("Threshold dla lokacji nie znaleziony"));
        
        // Pobierz wszystkie itemy w lokacji i zsumuj ich currentQuantity
        List<InventoryLocation> itemsInLocation = inventoryLocationRepository.findAllByLocation(location);
        int totalQuantity = itemsInLocation.stream()
                .mapToInt(inv -> inv.getItem().getCurrentQuantity())
                .sum();
        
        // Sprawdzaj czy całkowita ilość nie przekroczy maksymalnego progu
        return totalQuantity <= threshold.getMaxThreshold();
    }
    
    /**
     * Sprawdź czy ilość w lokacji przekroczyła minimalny próg
     * @param locationId ID lokacji
     * @param itemId ID itemu
     * @return true jeśli poniżej minimum, false jeśli wystarczająco
     */
    @Transactional(readOnly = true)
    public boolean isBelowMinThreshold(Long locationId, Long itemId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Lokacja nie znaleziona"));
        
        LocationThreshold threshold = thresholdRepository.findByLocation(location)
                .orElseThrow(() -> new IllegalArgumentException("Threshold dla lokacji nie znaleziony"));
        
        // Oblicz netto ilość na podstawie transakcji dla tej lokacji i itemu
        int currentQuantity = transactionRepository.sumQuantityByItemAndLocation(itemId, locationId);
        
        return currentQuantity < threshold.getMinThreshold();
    }
    
    /**
     * Uzyskaj informacje o obłożeniu lokacji (DTO)
     * Oblicza na podstawie item.currentQuantity wszystkich itemów w lokacji
     */
    @Transactional(readOnly = true)
    public LocationOccupancyDTO getLocationOccupancy(Long locationId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Lokacja nie znaleziona"));
        
        LocationThreshold threshold = thresholdRepository.findByLocation(location)
                .orElse(null);
        
        // Pobierz wszystkie itemy w tej lokacji i zsumuj ich currentQuantity
        List<InventoryLocation> itemsInLocation = inventoryLocationRepository.findAllByLocation(location);
        int totalQuantity = itemsInLocation.stream()
                .mapToInt(inv -> inv.getItem().getCurrentQuantity())
                .sum();
        
        double maxCapacity = threshold != null ? threshold.getMaxThreshold() : 0;
        double minThreshold = threshold != null ? threshold.getMinThreshold() : 0;
        
        double occupancyPercentage = maxCapacity > 0 ? (totalQuantity * 100.0) / maxCapacity : 0;
        
        boolean isAboveThreshold = totalQuantity >= minThreshold;
        
        return LocationOccupancyDTO.builder()
                .locationId(location.getId())
                .locationCode(location.getCode())
                .locationName(location.getName())
                .locationDescription(location.getDescription())
                .maxCapacity(maxCapacity)
                .minThreshold(minThreshold)
                .currentOccupancy(totalQuantity)
                .occupancyPercentage(occupancyPercentage)
                .itemCount(itemsInLocation.size()) // Liczba unikalnych itemów w lokacji
                .isAboveThreshold(isAboveThreshold)
                .isActive(location.isActive())
                .build();
    }
    
    /**
     * Dodaj item do lokacji (powiązanie)
     * 
     * WAŻNE: Ta metoda TYLKO tworzy powiązanie item-location.
     * Transakcje muszą być tworzone osobno na froncie/w controllerze.
     * Uniknięcie duplikowania ilości z transakcji.
     */
    @Transactional
    public InventoryLocation addItemToLocation(Long locationId, Long itemId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Lokacja nie znaleziona"));
        
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item nie znaleziony"));
        
        // Sprawdź czy item już istnieje w lokacji
        if (inventoryLocationRepository.existsByItemAndLocation(item, location)) {
            throw new IllegalArgumentException("Item już istnieje w tej lokacji");
        }
        
        // Sprawdź pojemność na podstawie currentQuantity wszystkich itemów w lokacji
        List<InventoryLocation> itemsInLocation = inventoryLocationRepository.findAllByLocation(location);
        int currentOccupancy = itemsInLocation.stream()
                .mapToInt(inv -> inv.getItem().getCurrentQuantity())
                .sum();
        
        LocationThreshold threshold = thresholdRepository.findByLocation(location)
                .orElseThrow(() -> new IllegalArgumentException("Threshold dla lokacji nie znaleziony"));
        
        // Sprawdź czy dodanie tego itemu nie przekroczy progu
        int newOccupancy = currentOccupancy + item.getCurrentQuantity();
        if (newOccupancy > threshold.getMaxThreshold()) {
            throw new IllegalStateException("Brak miejsca w lokacji. Maksymalna pojemność: " + 
                    threshold.getMaxThreshold() + ", bieżące obłożenie: " + currentOccupancy + 
                    ", ilość itemu: " + item.getCurrentQuantity());
        }
        
        // Dodaj powiązanie item-location
        InventoryLocation inventoryLocation = new InventoryLocation();
        inventoryLocation.setItem(item);
        inventoryLocation.setLocation(location);
        
        return inventoryLocationRepository.save(inventoryLocation);
    }
    
    /**
     * Usuń item z lokacji
     */
    @Transactional
    public void removeItemFromLocation(Long locationId, Long itemId) {
        Location location = new Location();
        location.setId(locationId);
        
        Item item = new Item();
        item.setId(itemId);
        
        InventoryLocation inventoryLocation = inventoryLocationRepository.findByItemAndLocation(item, location)
                .orElseThrow(() -> new IllegalArgumentException("Powiązanie item-location nie znalezione"));
        
        inventoryLocationRepository.delete(inventoryLocation);
    }
}
