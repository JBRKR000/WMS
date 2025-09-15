package com.kozimor.wms.Database.Service;

import com.kozimor.wms.Database.Model.Category;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public interface CategoryService {
    
    /**
     * Create a new category
     * @param category The category to create
     * @return The created category
     */
    Category createCategory(Category category);

    /**
     * Get all categories
     * @return List of all categories
     */
    List<Category> getAllCategories();

    /**
     * Get a category by its ID
     * @param id The ID of the category to find
     * @return The category if found, otherwise empty Optional
     */
    Optional<Category> getCategoryById(Long id);

    /**
     * Get a category by its name
     * @param name The name of the category to find
     * @return The category if found, otherwise empty Optional
     */
    Optional<Category> getCategoryByName(String name);

    /**
     * Update an existing category
     * @param id The ID of the category to update
     * @param category The updated category data
     * @return The updated category
     */
    Category updateCategory(Long id, Category category);

    /**
     * Delete a category by its ID
     * @param id The ID of the category to delete
     */
    void deleteCategory(Long id);
} 