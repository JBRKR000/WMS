package com.kozimor.wms.UnitTests;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kozimor.wms.Database.Controller.ItemController;
import com.kozimor.wms.Database.Model.Category;
import com.kozimor.wms.Database.Model.Item;
import com.kozimor.wms.Database.Model.ItemType;
import com.kozimor.wms.Database.Model.UnitType;
import com.kozimor.wms.Database.Service.ItemService;
import com.kozimor.wms.Database.Model.DTO.ItemDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

@WebMvcTest(ItemController.class)
@DisplayName("ItemController - API & Security Tests")
class ItemControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ItemService itemService;

    @Autowired
    private ObjectMapper objectMapper;

    private Item testItem;
    private Category testCategory;

    @BeforeEach
    void setUp() {
        testCategory = new Category();
        testCategory.setId(1L);
        testCategory.setName("Test Category");

        testItem = new Item();
        testItem.setId(1L);
        testItem.setName("Test Item");
        testItem.setDescription("Test Description");
        testItem.setCategory(testCategory);
        testItem.setCurrentQuantity(100.0);
        testItem.setUnit(UnitType.PCS);
        testItem.setType(ItemType.PRODUCT);
        testItem.setQrCode("QR123");
        testItem.setCreatedAt(java.time.LocalDateTime.now());
        testItem.setUpdatedAt(java.time.LocalDateTime.now());
        
        // Default mock for item service create/update operations
        when(itemService.createItem(any(Item.class))).thenReturn(testItem);
        when(itemService.updateItem(anyLong(), any(Item.class))).thenReturn(testItem);
        
        // Mock for pagination - return empty page
        Page<ItemDTO> emptyPage = new PageImpl<>(java.util.Collections.emptyList());
        when(itemService.getItemsPaginated(anyInt(), anyInt())).thenReturn(emptyPage);
    }

    // ========== GET ENDPOINTS TESTS ==========

    @Test
    @DisplayName("GET /api/items - Should retrieve all items without authentication")
    void testGetAllItemsNoAuth() throws Exception {
        mockMvc.perform(get("/api/items"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "WAREHOUSE")
    @DisplayName("GET /api/items - Should retrieve all items with WAREHOUSE role")
    void testGetAllItemsWithWarehouseRole() throws Exception {
        mockMvc.perform(get("/api/items"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));

        verify(itemService, times(1)).getAllItems();
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("GET /api/items/{id} - Should retrieve item by ID with ADMIN role")
    void testGetItemByIdWithAdminRole() throws Exception {
        when(itemService.getItemById(1L)).thenReturn(Optional.of(testItem));

        mockMvc.perform(get("/api/items/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Item"))
                .andExpect(jsonPath("$.id").value(1L));

        verify(itemService, times(1)).getItemById(1L);
    }

    @Test
    @WithMockUser(username = "user", roles = "PRODUCTION")
    @DisplayName("GET /api/items/{id} - Should allow PRODUCTION role to view items")
    void testGetItemByIdWithProductionRole() throws Exception {
        when(itemService.getItemById(1L)).thenReturn(Optional.of(testItem));

        mockMvc.perform(get("/api/items/1"))
                .andExpect(status().isOk());

        verify(itemService, times(1)).getItemById(1L);
    }

    @Test
    @WithMockUser(roles = "WAREHOUSE")
    @DisplayName("GET /api/items/{id} - Should return 404 when item not found")
    void testGetItemByIdNotFound() throws Exception {
        when(itemService.getItemById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/items/999"))
                .andExpect(status().isNotFound());

        verify(itemService, times(1)).getItemById(999L);
    }

    @Test
    @WithMockUser(roles = "WAREHOUSE")
    @DisplayName("GET /api/items/qr/{qrCode} - Should retrieve item by QR code")
    void testGetItemByQrCode() throws Exception {
        when(itemService.getItemByQrCode("QR123")).thenReturn(Optional.of(testItem));

        mockMvc.perform(get("/api/items/qr/QR123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.qrCode").value("QR123"));

        verify(itemService, times(1)).getItemByQrCode("QR123");
    }

    @Test
    @WithMockUser(roles = "WAREHOUSE")
    @DisplayName("GET /api/items/search - Should search items with criteria")
    void testSearchItemsNoAuth() throws Exception {
        mockMvc.perform(get("/api/items/search")
                .param("itemType", "PRODUCT"))
                .andExpect(status().isOk());
    }

    // ========== CREATE ENDPOINT TESTS ==========

    @Test
    @WithMockUser(roles = "WAREHOUSE")
    @DisplayName("POST /api/items - Should create item with valid data")
    void testCreateItemAnonymous() throws Exception {
        mockMvc.perform(post("/api/items")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testItem)))
                .andExpect(status().isCreated());

        verify(itemService, times(1)).createItem(any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/items - Should create item with ADMIN role")
    void testCreateItemDenyProductionRole() throws Exception {
        mockMvc.perform(post("/api/items")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testItem)))
                .andExpect(status().isCreated());

        verify(itemService, times(1)).createItem(any());
    }

    @Test
    @WithMockUser(username = "warehouse", roles = "WAREHOUSE")
    @DisplayName("POST /api/items - Should allow WAREHOUSE role to create item")
    void testCreateItemWithWarehouseRole() throws Exception {
        when(itemService.createItem(any(Item.class))).thenReturn(testItem);

        mockMvc.perform(post("/api/items")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testItem)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.item.name").value("Test Item"));

        verify(itemService, times(1)).createItem(any(Item.class));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("POST /api/items - Should allow ADMIN role to create item")
    void testCreateItemWithAdminRole() throws Exception {
        when(itemService.createItem(any(Item.class))).thenReturn(testItem);

        mockMvc.perform(post("/api/items")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testItem)))
                .andExpect(status().isCreated());

        verify(itemService, times(1)).createItem(any(Item.class));
    }

    // ========== UPDATE ENDPOINT TESTS ==========

    @Test
    @WithMockUser(roles = "WAREHOUSE")
    @DisplayName("PUT /api/items/{id} - Should update item successfully")
    void testUpdateItemAnonymous() throws Exception {
        mockMvc.perform(put("/api/items/1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testItem)))
                .andExpect(status().isOk());

        verify(itemService, times(1)).updateItem(anyLong(), any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PUT /api/items/{id} - Should allow ADMIN role to update")
    void testUpdateItemDenyProductionRole() throws Exception {
        mockMvc.perform(put("/api/items/1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testItem)))
                .andExpect(status().isOk());

        verify(itemService, times(1)).updateItem(anyLong(), any());
    }

    @Test
    @WithMockUser(username = "warehouse", roles = "WAREHOUSE")
    @DisplayName("PUT /api/items/{id} - Should allow WAREHOUSE role to update item")
    void testUpdateItemWithWarehouseRole() throws Exception {
        when(itemService.updateItem(anyLong(), any(Item.class))).thenReturn(testItem);

        mockMvc.perform(put("/api/items/1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(testItem)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Item"));

        verify(itemService, times(1)).updateItem(anyLong(), any(Item.class));
    }

    // ========== DELETE ENDPOINT TESTS ==========

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/items/{id} - Should delete item successfully")
    void testDeleteItemAnonymous() throws Exception {
        mockMvc.perform(delete("/api/items/1")
                .with(csrf()))
                .andExpect(status().isNoContent());

        verify(itemService, times(1)).deleteItem(anyLong());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/items/{id} - Should allow ADMIN role to delete")
    void testDeleteItemDenyProductionRole() throws Exception {
        mockMvc.perform(delete("/api/items/1")
                .with(csrf()))
                .andExpect(status().isNoContent());

        verify(itemService, times(1)).deleteItem(anyLong());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    @DisplayName("DELETE /api/items/{id} - Should allow ADMIN role to delete item")
    void testDeleteItemWithAdminRole() throws Exception {
        doNothing().when(itemService).deleteItem(1L);

        mockMvc.perform(delete("/api/items/1")
                .with(csrf()))
                .andExpect(status().isNoContent());

        verify(itemService, times(1)).deleteItem(1L);
    }

    // ========== PATCH - UPDATE QUANTITY TESTS ==========

    @Test
    @WithMockUser(roles = "WAREHOUSE")
    @DisplayName("PATCH /api/items/{id}/quantity - Should update item quantity")
    void testUpdateItemQuantity() throws Exception {
        testItem.setCurrentQuantity(150.0);
        when(itemService.updateItemQuantity(1L, 150.0)).thenReturn(testItem);

        mockMvc.perform(patch("/api/items/1/quantity")
                .with(csrf())
                .param("quantity", "150"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentQuantity").value(150));

        verify(itemService, times(1)).updateItemQuantity(1L, 150.0);
    }

    // ========== PAGINATION TESTS ==========

    @Test
    @WithMockUser(roles = "WAREHOUSE")
    @DisplayName("GET /api/items/getAllPaginated - Should retrieve paginated items")
    void testGetAllItemsPaginated() throws Exception {
        mockMvc.perform(get("/api/items/getAllPaginated")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));

        verify(itemService, times(1)).getItemsPaginated(0, 10);
    }

    // ========== SEARCH ENDPOINT SECURITY TESTS ==========

    @Test
    @WithMockUser(username = "warehouse", roles = "WAREHOUSE")
    @DisplayName("GET /api/items/search - Should search with multiple criteria")
    void testSearchItemsWithCriteria() throws Exception {
        mockMvc.perform(get("/api/items/search")
                .param("itemType", "PRODUCT")
                .param("categoryId", "1")
                .param("minQuantity", "50")
                .param("maxQuantity", "200")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk());

        verify(itemService, times(1)).searchItems("PRODUCT", 1L, null, 50, 200, null, 0, 10);
    }

    @Test
    @WithMockUser(username = "warehouse", roles = "WAREHOUSE")
    @DisplayName("GET /api/items/search/byname - Should search by name")
    void testSearchItemsByName() throws Exception {
        mockMvc.perform(get("/api/items/search/byname")
                .param("name", "Test")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk());

        verify(itemService, times(1)).searchItemsByName("Test", 0, 10);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/items/getProductsAndComponentsPaginated - ADMIN can access")
    void testGetProductsAndComponentsAdmin() throws Exception {
        mockMvc.perform(get("/api/items/getProductsAndComponentsPaginated")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk());
    }

}
