package com.kozimor.wms.Database.Controller;

import com.kozimor.wms.Database.Model.ScheduleConfig;
import com.kozimor.wms.Database.Service.ScheduleConfigService;
import com.kozimor.wms.Database.Service.SchedulerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/schedule")
@PreAuthorize("hasAnyRole('ROLE_ADMIN')")
public class ScheduleController {

    private final ScheduleConfigService scheduleConfigService;
    private final SchedulerService schedulerService;

    public ScheduleController(ScheduleConfigService scheduleConfigService, 
                            SchedulerService schedulerService) {
        this.scheduleConfigService = scheduleConfigService;
        this.schedulerService = schedulerService;
    }

    @GetMapping("/snapshot-config")
    public ResponseEntity<ScheduleConfig> getSnapshotConfig() {
        return ResponseEntity.ok(scheduleConfigService.getSnapshotConfig());
    }

    @PutMapping("/snapshot-config")
    public ResponseEntity<ScheduleConfig> updateSnapshotConfig(@RequestParam String cronExpression) {
        ScheduleConfig config = scheduleConfigService.updateSnapshotConfig(cronExpression);
        schedulerService.rescheduleSnapshot();
        return ResponseEntity.ok(config);
    }

    @PutMapping("/snapshot-config/toggle")
    public ResponseEntity<ScheduleConfig> toggleSchedule(@RequestParam Boolean enabled) {
        ScheduleConfig config = scheduleConfigService.toggleSchedule(enabled);
        return ResponseEntity.ok(config);
    }
}
