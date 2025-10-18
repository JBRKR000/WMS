package com.kozimor.wms.Database.Service.ServiceImpl;

import com.kozimor.wms.Database.Model.Item;
import com.kozimor.wms.Database.Model.Keyword;
import com.kozimor.wms.Database.Model.DTO.ItemDTO;
import com.kozimor.wms.Database.Model.ItemType;
import com.kozimor.wms.Database.Model.UnitType;
import com.kozimor.wms.Database.Repository.ItemRepository;
import com.kozimor.wms.Database.Repository.KeywordRepository;
import com.kozimor.wms.Database.Service.ItemService;
import jakarta.persistence.EntityNotFoundException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ItemServiceImpl implements ItemService {

    private final ItemRepository itemRepository;
    private final KeywordRepository keywordRepository;
    @Value("${app.qr.base-url}")
    private String qrBaseUrl;

    public ItemServiceImpl(ItemRepository itemRepository, KeywordRepository keywordRepository) {
        this.itemRepository = itemRepository;
        this.keywordRepository = keywordRepository;
    }

    @Override
    public Item createItem(Item item) {
        if (item.getQrCode() == null || item.getQrCode().isBlank()) {
            item.setQrCode(UUID.randomUUID().toString());
        }
        if (item.getKeywords() != null && !item.getKeywords().isEmpty()) {
            Set<String> normValues = item.getKeywords().stream()
                    .map(k -> k.getValue() == null ? null : k.getValue().trim().toLowerCase())
                    .filter(val -> val != null && !val.isEmpty())
                    .collect(Collectors.toSet());
            Set<Keyword> resolved = normValues.stream()
                    .map(norm -> keywordRepository.findByValue(norm)
                            .orElseGet(() -> keywordRepository.save(Keyword.builder().value(norm).build())))
                    .collect(Collectors.toSet());
            item.setKeywords(resolved);
        }
        Item saved = itemRepository.save(item);
        saved.setQrCode(buildQrUrl(saved));
        return itemRepository.save(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Item> getItemById(Long id) {
        return itemRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Item> getItemByQrCode(String qrCode) {
        return itemRepository.findByQrCode(qrCode);
    }

    @Override
    public Item updateItem(Long id, Item itemDetails) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + id));

        item.setName(itemDetails.getName());
        item.setDescription(itemDetails.getDescription());
        item.setCategory(itemDetails.getCategory());
        item.setUnit(itemDetails.getUnit());
        item.setCurrentQuantity(itemDetails.getCurrentQuantity());
        // item.setType(itemDetails.getType());
        // DO NOT update qrCode - it should remain unchanged
        // item.setQrCode(itemDetails.getQrCode()); 
        
        // update keywords if provided
        if (itemDetails.getKeywords() != null) {
            java.util.Set<Keyword> resolved = itemDetails.getKeywords().stream().map(k -> {
                String norm = k.getValue() == null ? null : k.getValue().trim().toLowerCase();
                if (norm == null || norm.isEmpty())
                    return null;
                return keywordRepository.findByValue(norm).orElseGet(() -> {
                    Keyword nk = Keyword.builder().value(norm).build();
                    return keywordRepository.save(nk);
                });
            }).filter(java.util.Objects::nonNull).collect(java.util.stream.Collectors.toSet());
            item.setKeywords(resolved);
        }

        return itemRepository.save(item);
    }

    @Override
    public Item updateItemQuantity(Long id, Integer quantity) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Item not found with id: " + id));

        item.setCurrentQuantity(quantity);
        return itemRepository.save(item);
    }

    @Override
    public void deleteItem(Long id) {
        if (!itemRepository.existsById(id)) {
            throw new EntityNotFoundException("Item not found with id: " + id);
        }
        itemRepository.deleteById(id);
    }

    @Override
    public long getItemCount() {
        return itemRepository.count();
    }

    public Page<ItemDTO> getItemsPaginated(int page, int size) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        PageRequest pageable = PageRequest.of(page, size);
        return itemRepository.findAllWithCategory(pageable).map(item -> {
            ItemDTO dto = new ItemDTO();
            dto.setId(item.getId());
            dto.setName(item.getName());
            dto.setDescription(item.getDescription());
            dto.setCategoryName(item.getCategory() != null ? item.getCategory().getName() : null);
            dto.setUnit(item.getUnit());
            dto.setCurrentQuantity(item.getCurrentQuantity());
            dto.setQrCode(item.getQrCode());
            dto.setItemType(item.getType());
            dto.setCreatedAt(item.getCreatedAt().format(formatter));
            dto.setUpdatedAt(item.getUpdatedAt().format(formatter));
            Set<String> kw = item.getKeywords() == null ? java.util.Collections.emptySet()
                    : item.getKeywords().stream().map(k -> k.getValue()).collect(Collectors.toSet());
            dto.setKeywords(kw);
            return dto;
        });
    }

    @Override
    public String buildQrUrl(Item item) {
        return qrBaseUrl + "/items/" + item.getId() + "/edit?code=" + item.getQrCode();
    }

    @Override
    public Page<ItemDTO> getProductsAndComponentsPaginated(int page, int size) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        PageRequest pr = PageRequest.of(page, size);
        return itemRepository
            .findAllByTypeIn(Arrays.asList(ItemType.PRODUCT, ItemType.COMPONENT), pr)
            .map(item -> {
                ItemDTO dto = new ItemDTO();
                dto.setId(item.getId());
                dto.setName(item.getName());
                dto.setDescription(item.getDescription());
                dto.setCategoryName(item.getCategory() != null
                    ? item.getCategory().getName() : null);
                dto.setUnit(item.getUnit());
                dto.setCurrentQuantity(item.getCurrentQuantity());
                dto.setQrCode(item.getQrCode());
                dto.setItemType(item.getType());
                dto.setCreatedAt(item.getCreatedAt().format(fmt));
                dto.setUpdatedAt(item.getUpdatedAt().format(fmt));
                Set<String> kw = item.getKeywords() == null
                    ? java.util.Collections.emptySet()
                    : item.getKeywords().stream().map(k -> k.getValue()).collect(Collectors.toSet());
                dto.setKeywords(kw);
                return dto;
            });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ItemDTO> searchItems(
            String itemType,
            Long categoryId,
            String unit,
            Integer minQuantity,
            Integer maxQuantity,
            String keywords,
            int page,
            int size) {
        
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        PageRequest pageable = PageRequest.of(page, size);
        
        // Convert itemType string to enum, null if not provided
        ItemType type = null;
        if (itemType != null && !itemType.isBlank()) {
            try {
                type = ItemType.valueOf(itemType.toUpperCase());
            } catch (IllegalArgumentException e) {
                type = null;
            }
        }
        
        // Convert unit string to UnitType enum, null if not provided
        UnitType unitEnum = null;
        if (unit != null && !unit.isBlank()) {
            try {
                unitEnum = UnitType.valueOf(unit.toUpperCase());
            } catch (IllegalArgumentException e) {
                unitEnum = null;
            }
        }
        
        // Format keywords with wildcards for ILIKE search
        String keywordsPattern = null;
        if (keywords != null && !keywords.isBlank()) {
            keywordsPattern = "%" + keywords + "%";
        }
        
        // Search items using repository query
        Page<Item> results = itemRepository.searchItems(
                type,
                categoryId,
                unitEnum,
                minQuantity,
                maxQuantity,
                keywordsPattern,
                pageable
        );
        
        // Convert to DTO
        return results.map(item -> {
            ItemDTO dto = new ItemDTO();
            dto.setId(item.getId());
            dto.setName(item.getName());
            dto.setDescription(item.getDescription());
            dto.setCategoryName(item.getCategory() != null ? item.getCategory().getName() : null);
            dto.setUnit(item.getUnit());
            dto.setCurrentQuantity(item.getCurrentQuantity());
            dto.setQrCode(item.getQrCode());
            dto.setItemType(item.getType());
            dto.setCreatedAt(item.getCreatedAt().format(fmt));
            dto.setUpdatedAt(item.getUpdatedAt().format(fmt));
            Set<String> kw = item.getKeywords() == null
                ? java.util.Collections.emptySet()
                : item.getKeywords().stream().map(k -> k.getValue()).collect(Collectors.toSet());
            dto.setKeywords(kw);
            return dto;
        });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ItemDTO> searchItemsByName(String name, int page, int size) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        PageRequest pageable = PageRequest.of(page, size);
        
        // Format name with wildcards for ILIKE search
        String namePattern = "%" + name + "%";
        
        // Search items by name using repository query
        Page<Item> results = itemRepository.searchItemsByName(namePattern, pageable);
        
        // Convert to DTO
        return results.map(item -> {
            ItemDTO dto = new ItemDTO();
            dto.setId(item.getId());
            dto.setName(item.getName());
            dto.setDescription(item.getDescription());
            dto.setCategoryName(item.getCategory() != null ? item.getCategory().getName() : null);
            dto.setUnit(item.getUnit());
            dto.setCurrentQuantity(item.getCurrentQuantity());
            dto.setQrCode(item.getQrCode());
            dto.setItemType(item.getType());
            dto.setCreatedAt(item.getCreatedAt().format(fmt));
            dto.setUpdatedAt(item.getUpdatedAt().format(fmt));
            Set<String> kw = item.getKeywords() == null
                ? java.util.Collections.emptySet()
                : item.getKeywords().stream().map(k -> k.getValue()).collect(Collectors.toSet());
            dto.setKeywords(kw);
            return dto;
        });
    }

}