package com.kozimor.wms.Database.Repository;

import com.kozimor.wms.Database.Model.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    
    /**
     * Pobierz lokację po kodzie
     */
    Optional<Location> findByCode(String code);
    
    /**
     * Pobierz wszystkie aktywne lokacje
     */
    List<Location> findAllByActiveTrue();
    
    /**
     * Pobierz lokacje po typie
     */
    List<Location> findAllByType(String type);
    
    /**
     * Pobierz aktywne lokacje po typie
     */
    List<Location> findAllByTypeAndActiveTrue(String type);
}
