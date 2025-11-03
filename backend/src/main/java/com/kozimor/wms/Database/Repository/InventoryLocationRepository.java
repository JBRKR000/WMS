package com.kozimor.wms.Database.Repository;

import com.kozimor.wms.Database.Model.InventoryLocation;
import com.kozimor.wms.Database.Model.Item;
import com.kozimor.wms.Database.Model.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryLocationRepository extends JpaRepository<InventoryLocation, Long> {
    
    /**
     * Pobierz powiązanie item-location
     */
    Optional<InventoryLocation> findByItemAndLocation(Item item, Location location);
    
    /**
     * Pobierz wszystkie itemy w danej lokacji
     */
    List<InventoryLocation> findAllByLocation(Location location);
    
    /**
     * Pobierz wszystkie lokacje dla danego itemu
     */
    List<InventoryLocation> findAllByItem(Item item);
    
    /**
     * Policz ile itemów jest w danej lokacji
     */
    @Query("SELECT COUNT(il) FROM InventoryLocation il WHERE il.location = :location")
    int countItemsInLocation(@Param("location") Location location);
    
    /**
     * Sprawdzenie czy item już jest w lokacji
     */
    @Query("SELECT CASE WHEN COUNT(il) > 0 THEN true ELSE false END FROM InventoryLocation il " +
           "WHERE il.item = :item AND il.location = :location")
    boolean existsByItemAndLocation(@Param("item") Item item, @Param("location") Location location);
}
