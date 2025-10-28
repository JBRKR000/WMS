package com.kozimor.wms.Database.Repository;

import com.kozimor.wms.Database.Model.ScheduleConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ScheduleConfigRepository extends JpaRepository<ScheduleConfig, Long> {
    Optional<ScheduleConfig> findByConfigKey(String configKey);
}
