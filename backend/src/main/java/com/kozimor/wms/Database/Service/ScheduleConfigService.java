package com.kozimor.wms.Database.Service;

import com.kozimor.wms.Database.Model.ScheduleConfig;
import com.kozimor.wms.Database.Repository.ScheduleConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ScheduleConfigService {

    private final ScheduleConfigRepository scheduleConfigRepository;

    public ScheduleConfigService(ScheduleConfigRepository scheduleConfigRepository) {
        this.scheduleConfigRepository = scheduleConfigRepository;
    }

    public ScheduleConfig getSnapshotConfig() {
        return scheduleConfigRepository.findByConfigKey("snapshot_schedule")
                .orElseGet(this::createDefaultConfig);
    }

    public ScheduleConfig updateSnapshotConfig(String cronExpression) {
        ScheduleConfig config = getSnapshotConfig();
        config.setCronExpression(cronExpression);
        return scheduleConfigRepository.save(config);
    }

    public ScheduleConfig toggleSchedule(Boolean enabled) {
        ScheduleConfig config = getSnapshotConfig();
        config.setEnabled(enabled);
        return scheduleConfigRepository.save(config);
    }

    private ScheduleConfig createDefaultConfig() {
        ScheduleConfig config = ScheduleConfig.builder()
                .configKey("snapshot_schedule")
                .cronExpression("0 0 15 ? * MON")
                .description("Weekly snapshot every Monday at 15:00")
                .enabled(true)
                .build();
        return scheduleConfigRepository.save(config);
    }
}
