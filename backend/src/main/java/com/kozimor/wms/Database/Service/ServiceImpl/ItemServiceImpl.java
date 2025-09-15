package com.kozimor.wms.Database.Service.ServiceImpl;

import com.kozimor.wms.Database.Model.Item;
import com.kozimor.wms.Database.Repository.ItemRepository;
import com.kozimor.wms.Database.Service.ItemService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ItemServiceImpl implements ItemService {

    private final ItemRepository itemRepository;

    @Autowired
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
}