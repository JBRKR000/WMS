package com.kozimor.wms.Database.Controller;

import com.kozimor.wms.Database.Model.Item;
import com.kozimor.wms.Database.Model.DTO.ItemDTO;
import com.kozimor.wms.Database.Service.ItemService;

import com.google.zxing.WriterException;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;

import org.springframework.http.MediaType;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;


@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemService itemService;

    @Value("${app.qr.base-url}")
    private String qrBaseUrl;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @PostMapping
    public ResponseEntity<java.util.Map<String, Object>> createItem(@Valid @RequestBody Item item) {
        Item created = itemService.createItem(item);
        String qrUrl = itemService.buildQrUrl(created);
        ItemDTO dto = new ItemDTO();
        dto.setId(created.getId());
        dto.setName(created.getName());
        dto.setDescription(created.getDescription());
        dto.setCategoryName(created.getCategory() != null ? created.getCategory().getName() : null);
        dto.setUnit(created.getUnit());
        dto.setCurrentQuantity(created.getCurrentQuantity());
        dto.setQrCode(created.getQrCode());
        dto.setItemType(created.getType());
        dto.setCreatedAt(
                created.getCreatedAt().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        dto.setUpdatedAt(
                created.getUpdatedAt().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        dto.setKeywords(created.getKeywords() != null
                ? created.getKeywords().stream().map(k -> k.getValue()).collect(java.util.stream.Collectors.toSet())
                : java.util.Collections.emptySet());
        java.util.Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("item", dto);
        resp.put("qrUrl", qrUrl);
        return new ResponseEntity<>(resp, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Item>> getAllItems() {
        List<Item> items = itemService.getAllItems();
        return ResponseEntity.ok(items);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Item> getItemById(@PathVariable Long id) {
        return itemService.getItemById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/qr/{qrCode}")
    public ResponseEntity<Item> getItemByQrCode(@PathVariable String qrCode) {
        return itemService.getItemByQrCode(qrCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
public ResponseEntity<ItemDTO> updateItem(@PathVariable Long id, @Valid @RequestBody Item item) {
    try {
        Item updatedItem = itemService.updateItem(id, item);
        
        // Convert to DTO
        ItemDTO dto = new ItemDTO();
        dto.setId(updatedItem.getId());
        dto.setName(updatedItem.getName());
        dto.setDescription(updatedItem.getDescription());
        dto.setCategoryName(updatedItem.getCategory() != null ? updatedItem.getCategory().getName() : null);
        dto.setUnit(updatedItem.getUnit());
        dto.setCurrentQuantity(updatedItem.getCurrentQuantity());
        dto.setQrCode(updatedItem.getQrCode());
        dto.setItemType(updatedItem.getType());
        dto.setCreatedAt(
                updatedItem.getCreatedAt().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        dto.setUpdatedAt(
                updatedItem.getUpdatedAt().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        dto.setKeywords(updatedItem.getKeywords() != null
                ? updatedItem.getKeywords().stream().map(k -> k.getValue()).collect(java.util.stream.Collectors.toSet())
                : java.util.Collections.emptySet());
        
        return ResponseEntity.ok(dto);
    } catch (Exception e) {
        return ResponseEntity.notFound().build();
    }
}

    @PatchMapping("/{id}/quantity")
    public ResponseEntity<Item> updateItemQuantity(
            @PathVariable Long id,
            @RequestParam Integer quantity) {
        try {
            Item updatedItem = itemService.updateItemQuantity(id, quantity);
            return ResponseEntity.ok(updatedItem);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        try {
            itemService.deleteItem(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/getItemCount")
    public String getItemCount() {
        long count = itemService.getItemCount();
        return String.valueOf(count);
    }

    @GetMapping("/getAllPaginated")
    public ResponseEntity<Page<ItemDTO>> getAllPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ItemDTO> items = itemService.getItemsPaginated(page, size);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/{id}/qrcode")
    public ResponseEntity<byte[]> getItemQrCode(@PathVariable Long id)
            throws WriterException, IOException {
        Item item = itemService.getItemById(id)
                .orElseThrow(() -> new EntityNotFoundException("Item not found: " + id));

        String payload = qrBaseUrl + "/items/" + id + "/edit?code=" + item.getQrCode();
        BitMatrix matrix = new QRCodeWriter()
                .encode(payload, BarcodeFormat.QR_CODE, 250, 250);
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(out.toByteArray());
        }
    }

    @GetMapping("/getProductsAndComponentsPaginated")
    public ResponseEntity<Page<ItemDTO>> getProductsAndComponentsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ItemDTO> products = itemService.getProductsAndComponentsPaginated(page, size);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ItemDTO>> searchItems(
            @RequestParam(required = false) String itemType,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String unit,
            @RequestParam(required = false) Integer minQuantity,
            @RequestParam(required = false) Integer maxQuantity,
            @RequestParam(required = false) String keywords,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String unitEnum = null;
        if (unit != null && !unit.isEmpty()) {
            try {
                unitEnum = unit; 
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        
        Page<ItemDTO> results = itemService.searchItems(
                itemType,
                categoryId,
                unitEnum,
                minQuantity,
                maxQuantity,
                keywords,
                page,
                size
        );
        return ResponseEntity.ok(results);
    }

    @GetMapping("/search/byname")
    public ResponseEntity<Page<ItemDTO>> searchItemsByName(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ItemDTO> results = itemService.searchItemsByName(name, page, size);
        return ResponseEntity.ok(results);
    }

}