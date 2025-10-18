package com.kozimor.wms.Database.Service;

import com.kozimor.wms.Database.Model.Item;
import com.kozimor.wms.Database.Model.DTO.ItemDTO;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public interface ItemService {
    
    /**
     * Create a new item
     * @param item The item to create
     * @return The created item
     */
    Item createItem(Item item);

    /**
     * Get all items
     * @return List of all items
     */
    List<Item> getAllItems();

    /**
     * Get an item by its ID
     * @param id The ID of the item to find
     * @return The item if found, otherwise empty Optional
     */
    Optional<Item> getItemById(Long id);

    /**
     * Get an item by its QR code
     * @param qrCode The QR code of the item to find
     * @return The item if found, otherwise empty Optional
     */
    Optional<Item> getItemByQrCode(String qrCode);

    /**
     * Update an existing item
     * @param id The ID of the item to update
     * @param item The updated item data
     * @return The updated item
     */
    Item updateItem(Long id, Item itemDetails);

    /**
     * Update item quantity
     * @param id The ID of the item
     * @param quantity The new quantity
     * @return The updated item
     */
    Item updateItemQuantity(Long id, Integer quantity);

    /**
     * Delete an item by its ID
     * @param id The ID of the item to delete
     */
    void deleteItem(Long id);

    long getItemCount();

    Page<ItemDTO> getItemsPaginated(int page, int size);
    Page<ItemDTO> getProductsAndComponentsPaginated(int page, int size);
    String buildQrUrl(Item item);

    /**
     * Advanced search with multiple criteria
     * @param itemType Filter by item type (PRODUCT, COMPONENT, MATERIAL) - optional
     * @param categoryId Filter by category ID - optional
     * @param unit Filter by unit (PCS, KG, LITER, METER) - optional
     * @param minQuantity Filter by minimum quantity - optional
     * @param maxQuantity Filter by maximum quantity - optional
     * @param keywords Filter by keywords (comma-separated or single) - optional
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of ItemDTO matching the criteria
     */
    Page<ItemDTO> searchItems(
            String itemType,
            Long categoryId,
            String unit,
            Integer minQuantity,
            Integer maxQuantity,
            String keywords,
            int page,
            int size
    );

    /**
     * Search items by name
     * @param name The name or partial name to search for (case-insensitive)
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Page of ItemDTO matching the name
     */
    Page<ItemDTO> searchItemsByName(String name, int page, int size);
}