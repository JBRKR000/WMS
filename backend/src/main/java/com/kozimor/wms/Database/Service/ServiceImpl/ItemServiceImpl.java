package com.kozimor.wms.Database.Service.ServiceImpl;

import com.kozimor.wms.Database.Model.Item;
import com.kozimor.wms.Database.Model.Keyword;
import com.kozimor.wms.Database.Model.DTO.ItemDTO;
import com.kozimor.wms.Database.Repository.ItemRepository;
import com.kozimor.wms.Database.Repository.KeywordRepository;
import com.kozimor.wms.Database.Service.ItemService;
import jakarta.persistence.EntityNotFoundException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class ItemServiceImpl implements ItemService {

    private final ItemRepository itemRepository;
    private final KeywordRepository keywordRepository;

    public ItemServiceImpl(ItemRepository itemRepository, KeywordRepository keywordRepository) {
        this.itemRepository = itemRepository;
        this.keywordRepository = keywordRepository;
    }

    @Override
    public Item createItem(Item item) {
        if (item.getKeywords() != null && !item.getKeywords().isEmpty()) {
            java.util.Set<Keyword> resolved = item.getKeywords().stream().map(k -> {
                String norm = k.getValue() == null ? null : k.getValue().trim().toLowerCase();
                if (norm == null || norm.isEmpty()) return null;
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
        item.setQrCode(itemDetails.getQrCode());
        // update keywords if provided
        if (itemDetails.getKeywords() != null) {
            java.util.Set<Keyword> resolved = itemDetails.getKeywords().stream().map(k -> {
                String norm = k.getValue() == null ? null : k.getValue().trim().toLowerCase();
                if (norm == null || norm.isEmpty()) return null;
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
    	 dto.setCreatedAt(item.getCreatedAt().format(formatter));
    	 dto.setUpdatedAt(item.getUpdatedAt().format(formatter));
        Set<String> kw = item.getKeywords() == null ? java.util.Collections.emptySet()
            : item.getKeywords().stream().map(k -> k.getValue()).collect(Collectors.toSet());
        dto.setKeywords(kw);
        return dto;
    });
}
}