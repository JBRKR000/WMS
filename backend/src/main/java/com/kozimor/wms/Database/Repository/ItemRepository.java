package com.kozimor.wms.Database.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

import java.util.Collection;
import java.util.Optional;

import com.kozimor.wms.Database.Model.Item;
import com.kozimor.wms.Database.Model.ItemType;
import com.kozimor.wms.Database.Model.UnitType;

public interface ItemRepository extends JpaRepository<Item, Long> 
{
    Optional<Item> findByQrCode(String qrCode);

    @EntityGraph(attributePaths = {"category", "keywords"})
    @Query("select i from Item i")
    Page<Item> findAllWithCategory(Pageable pageable);
    
    Page<Item> findAllByType(ItemType type, Pageable pageable);
    Page<Item> findAllByTypeIn(Collection<ItemType> types, Pageable pageable);
    
    /**
     * Find all items associated with a given category ID
     */
    List<Item> findAllByCategory_Id(Long categoryId);
    
    /**
     * Find all items associated with a given keyword ID
     */
    List<Item> findAllByKeywords_Id(Long keywordId);
    
    /**
     * Advanced search with multiple criteria
     */
    @EntityGraph(attributePaths = {"category", "keywords"})
    @Query("SELECT DISTINCT i FROM Item i " +
           "LEFT JOIN i.category c " +
           "LEFT JOIN i.keywords k " +
           "WHERE (:itemType IS NULL OR i.type = :itemType) " +
           "AND (:categoryId IS NULL OR c.id = :categoryId) " +
           "AND (:unit IS NULL OR i.unit = :unit) " +
           "AND (:minQuantity IS NULL OR i.currentQuantity >= :minQuantity) " +
           "AND (:maxQuantity IS NULL OR i.currentQuantity <= :maxQuantity) " +
           "AND (:keywords IS NULL OR k.value ILIKE :keywords) " +
           "ORDER BY i.id DESC")
    Page<Item> searchItems(
            @Param("itemType") ItemType itemType,
            @Param("categoryId") Long categoryId,
            @Param("unit") UnitType unit,
            @Param("minQuantity") Integer minQuantity,
            @Param("maxQuantity") Integer maxQuantity,
            @Param("keywords") String keywords,
            Pageable pageable
    );

    /**
     * Search items by name (case-insensitive)
     */
    @EntityGraph(attributePaths = {"category", "keywords"})
    @Query("SELECT i FROM Item i " +
           "WHERE i.name ILIKE :name " +
           "ORDER BY i.name ASC, i.id DESC")
    Page<Item> searchItemsByName(@Param("name") String name, Pageable pageable);

    
}
