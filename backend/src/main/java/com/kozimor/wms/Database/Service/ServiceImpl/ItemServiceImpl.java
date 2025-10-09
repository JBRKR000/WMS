package com.kozimor.wms.Database.Service.ServiceImpl;

import com.kozimor.wms.Database.Model.Item;
import com.kozimor.wms.Database.Model.DTO.ItemDTO;
import com.kozimor.wms.Database.Repository.ItemRepository;
import com.kozimor.wms.Database.Service.ItemService;
import jakarta.persistence.EntityNotFoundException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import javax.swing.text.DateFormatter;

@Service
@Transactional
public class ItemServiceImpl implements ItemService {

    private final ItemRepository itemRepository;

    public ItemServiceImpl(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    @Override
    public Item createItem(Item item) {
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
    return itemRepository.findAll(pageable).map(item -> {
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
        return dto;
    });
}
}