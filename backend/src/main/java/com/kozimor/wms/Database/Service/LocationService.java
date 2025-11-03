package com.kozimor.wms.Database.Service;

import com.kozimor.wms.Database.Model.InventoryLocation;
import com.kozimor.wms.Database.Model.Item;
import com.kozimor.wms.Database.Model.Location;
import com.kozimor.wms.Database.Model.LocationThreshold;
import com.kozimor.wms.Database.Model.Transaction;
import com.kozimor.wms.Database.Model.TransactionType;
import com.kozimor.wms.Database.Model.TransactionStatus;
import com.kozimor.wms.Database.Model.User;
import com.kozimor.wms.Database.Model.DTO.LocationOccupancyDTO;
import com.kozimor.wms.Database.Repository.InventoryLocationRepository;
import com.kozimor.wms.Database.Repository.ItemRepository;
import com.kozimor.wms.Database.Repository.LocationRepository;
import com.kozimor.wms.Database.Repository.LocationThresholdRepository;
import com.kozimor.wms.Database.Repository.TransactionRepository;
import com.kozimor.wms.Database.Repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final UserRepository userRepository;
    
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
        
        // Pobierz całkowitą ilość (quantity) ze wszystkich transakcji dla tej lokacji
        int totalQuantity = transactionRepository.sumQuantityByLocation(locationId);
        
        // Sprawdzaj czy całkowita ilość + 1 (nowy item) nie przekroczy maksymalnego progu
        return (totalQuantity + 1) <= threshold.getMaxThreshold();
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
        
        int currentQuantity = transactionRepository.sumQuantityByItemAndLocation(itemId, locationId);
        
        return currentQuantity < threshold.getMinThreshold();
    }
    
    /**
     * Uzyskaj informacje o obłożeniu lokacji (DTO)
     */
    @Transactional(readOnly = true)
    public LocationOccupancyDTO getLocationOccupancy(Long locationId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Lokacja nie znaleziona"));
        
        LocationThreshold threshold = thresholdRepository.findByLocation(location)
                .orElse(null);
        
        // Pobierz całkowitą ilość (quantity) ze wszystkich transakcji dla tej lokacji
        int totalQuantity = transactionRepository.sumQuantityByLocation(locationId);
        
        int maxCapacity = threshold != null ? threshold.getMaxThreshold() : 0;
        int minThreshold = threshold != null ? threshold.getMinThreshold() : 0;
        
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
                .itemCount(totalQuantity)
                .isAboveThreshold(isAboveThreshold)
                .isActive(location.isActive())
                .build();
    }
    
    /**
     * Dodaj item do lokacji (powiązanie)
     */
    @Transactional
    public InventoryLocation addItemToLocation(Long locationId, Long itemId) {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new IllegalArgumentException("Lokacja nie znaleziona"));
        
        Item item = new Item();
        item.setId(itemId);
        
        // Sprawdź czy item już istnieje w lokacji
        if (inventoryLocationRepository.existsByItemAndLocation(item, location)) {
            throw new IllegalArgumentException("Item już istnieje w tej lokacji");
        }
        
        // Sprawdź pojemność
        if (!canAddItem(locationId, itemId)) {
            throw new IllegalStateException("Brak miejsca w lokacji");
        }
        
        InventoryLocation inventoryLocation = new InventoryLocation();
        inventoryLocation.setItem(item);
        inventoryLocation.setLocation(location);
        
        inventoryLocationRepository.save(inventoryLocation);
        
        // Pobierz pełne dane itemu z bazy
        Item fullItem = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item nie znaleziony"));
        
        int initialQuantity = fullItem.getCurrentQuantity() != null ? fullItem.getCurrentQuantity() : 0;
        
        // Pobierz aktualnego użytkownika z Security Context
        User currentUser = null;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            currentUser = userRepository.findByUsername(username).orElse(null);
        }
        
        Transaction transaction = Transaction.builder()
                .item(fullItem)
                .transactionType(TransactionType.RECEIPT)
                .quantity(initialQuantity)
                .transactionStatus(TransactionStatus.COMPLETED)
                .user(currentUser)
                .description("Dodanie itemu do lokacji: " + location.getCode())
                .build();
        
        transactionRepository.save(transaction);
        
        return inventoryLocation;
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
