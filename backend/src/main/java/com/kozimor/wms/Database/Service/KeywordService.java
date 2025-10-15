package com.kozimor.wms.Database.Service;

import com.kozimor.wms.Database.Model.Keyword;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public interface KeywordService {
    
    /**
     * Create a new keyword
     * @param keyword The keyword to create
     * @return The created keyword
     */
    Keyword createKeyword(Keyword keyword);

    /**
     * Get all keywords
     * @return List of all keywords
     */
    List<Keyword> getAllKeywords();

    /**
     * Get a keyword by its ID
     * @param id The ID of the keyword to find
     * @return The keyword if found, otherwise empty Optional
     */
    Optional<Keyword> getKeywordById(Long id);

    /**
     * Get a keyword by its value
     * @param value The value of the keyword to find
     * @return The keyword if found, otherwise empty Optional
     */
    Optional<Keyword> getKeywordByValue(String value);

    /**
     * Update an existing keyword
     * @param id The ID of the keyword to update
     * @param keyword The updated keyword data
     * @return The updated keyword
     */
    Keyword updateKeyword(Long id, Keyword keyword);

    /**
     * Delete a keyword by its ID
     * @param id The ID of the keyword to delete
     */
    void deleteKeyword(Long id);

    /**
     * Get the total count of keywords
     * @return The number of keywords in the database
     */
    long getKeywordCount();

    /**
     * Find keywords by value containing a specific string (case-insensitive)
     * @param value The string to search for in keyword values
     * @return List of keywords containing the specified value
     */
    List<Keyword> findKeywordsByValueContaining(String value);
    /**
     * Get all keywords associated with an item by its ID
     * @param itemId The ID of the item
     * @return List of keywords for the given item
     */
    List<Keyword> getKeywordsByItemId(Long itemId);
}