package com.kozimor.wms.Database.Repository;

import com.kozimor.wms.Database.Model.Location;
import com.kozimor.wms.Database.Model.LocationThreshold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LocationThresholdRepository extends JpaRepository<LocationThreshold, Long> {
    
    /**
     * Pobierz threshold dla danej lokacji
     */
    Optional<LocationThreshold> findByLocation(Location location);
}
