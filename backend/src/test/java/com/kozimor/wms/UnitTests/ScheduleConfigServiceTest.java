package com.kozimor.wms.UnitTests;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.kozimor.wms.Database.Model.ScheduleConfig;
import com.kozimor.wms.Database.Repository.ScheduleConfigRepository;
import com.kozimor.wms.Database.Service.ScheduleConfigService;

@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleConfigService - Unit Tests")
class ScheduleConfigServiceTest {

    @Mock
    private ScheduleConfigRepository scheduleConfigRepository;

    @InjectMocks
    private ScheduleConfigService scheduleConfigService;

    private ScheduleConfig scheduleConfig;

    @BeforeEach
    void setUp() {
        scheduleConfig = ScheduleConfig.builder()
                .id(1L)
                .configKey("snapshot_schedule")
                .cronExpression("0 0 15 ? * MON")
                .description("Weekly snapshot every Monday at 15:00")
                .enabled(true)
                .build();
    }

    // ========== GET SNAPSHOT CONFIG TESTS ==========

    @Test
    @DisplayName("Should retrieve existing snapshot config")
    void testGetSnapshotConfigExisting() {
        when(scheduleConfigRepository.findByConfigKey("snapshot_schedule"))
                .thenReturn(Optional.of(scheduleConfig));

        ScheduleConfig result = scheduleConfigService.getSnapshotConfig();

        assertNotNull(result);
        assertEquals("snapshot_schedule", result.getConfigKey());
        assertEquals("0 0 15 ? * MON", result.getCronExpression());
        assertEquals("Weekly snapshot every Monday at 15:00", result.getDescription());
        assertTrue(result.getEnabled());
        verify(scheduleConfigRepository, times(1)).findByConfigKey("snapshot_schedule");
        verify(scheduleConfigRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should create and return default config when not found")
    void testGetSnapshotConfigNotFoundCreatesDefault() {
        ScheduleConfig defaultConfig = ScheduleConfig.builder()
                .id(1L)
                .configKey("snapshot_schedule")
                .cronExpression("0 0 15 ? * MON")
                .description("Weekly snapshot every Monday at 15:00")
                .enabled(true)
                .build();

        when(scheduleConfigRepository.findByConfigKey("snapshot_schedule"))
                .thenReturn(Optional.empty());
        when(scheduleConfigRepository.save(any(ScheduleConfig.class)))
                .thenReturn(defaultConfig);

        ScheduleConfig result = scheduleConfigService.getSnapshotConfig();

        assertNotNull(result);
        assertEquals("snapshot_schedule", result.getConfigKey());
        assertEquals("0 0 15 ? * MON", result.getCronExpression());
        assertEquals("Weekly snapshot every Monday at 15:00", result.getDescription());
        assertTrue(result.getEnabled());
        verify(scheduleConfigRepository, times(1)).findByConfigKey("snapshot_schedule");
        verify(scheduleConfigRepository, times(1)).save(any(ScheduleConfig.class));
    }

    @Test
    @DisplayName("Should verify default config has correct default values")
    void testDefaultConfigDefaultValues() {
        ScheduleConfig defaultConfig = ScheduleConfig.builder()
                .id(1L)
                .configKey("snapshot_schedule")
                .cronExpression("0 0 15 ? * MON")
                .description("Weekly snapshot every Monday at 15:00")
                .enabled(true)
                .build();

        when(scheduleConfigRepository.findByConfigKey("snapshot_schedule"))
                .thenReturn(Optional.empty());
        when(scheduleConfigRepository.save(any(ScheduleConfig.class)))
                .thenReturn(defaultConfig);

        ScheduleConfig result = scheduleConfigService.getSnapshotConfig();

        assertEquals("snapshot_schedule", result.getConfigKey());
        assertEquals("0 0 15 ? * MON", result.getCronExpression());
        assertTrue(result.getEnabled());
        assertNotNull(result.getDescription());
    }

    // ========== UPDATE SNAPSHOT CONFIG TESTS ==========

    @Test
    @DisplayName("Should update snapshot config with new cron expression")
    void testUpdateSnapshotConfigSuccessfully() {
        String newCronExpression = "0 0 12 ? * FRI";
        ScheduleConfig updatedConfig = ScheduleConfig.builder()
                .id(1L)
                .configKey("snapshot_schedule")
                .cronExpression(newCronExpression)
                .description("Weekly snapshot every Monday at 15:00")
                .enabled(true)
                .build();

        when(scheduleConfigRepository.findByConfigKey("snapshot_schedule"))
                .thenReturn(Optional.of(scheduleConfig));
        when(scheduleConfigRepository.save(any(ScheduleConfig.class)))
                .thenReturn(updatedConfig);

        ScheduleConfig result = scheduleConfigService.updateSnapshotConfig(newCronExpression);

        assertNotNull(result);
        assertEquals(newCronExpression, result.getCronExpression());
        verify(scheduleConfigRepository, times(1)).findByConfigKey("snapshot_schedule");
        verify(scheduleConfigRepository, times(1)).save(any(ScheduleConfig.class));
    }

    @Test
    @DisplayName("Should create default config and update it when not exists")
    void testUpdateSnapshotConfigCreatesDefaultFirst() {
        String newCronExpression = "0 0 10 ? * *";
        ScheduleConfig defaultConfig = ScheduleConfig.builder()
                .id(1L)
                .configKey("snapshot_schedule")
                .cronExpression("0 0 15 ? * MON")
                .description("Weekly snapshot every Monday at 15:00")
                .enabled(true)
                .build();

        ScheduleConfig updatedConfig = ScheduleConfig.builder()
                .id(1L)
                .configKey("snapshot_schedule")
                .cronExpression(newCronExpression)
                .description("Weekly snapshot every Monday at 15:00")
                .enabled(true)
                .build();

        when(scheduleConfigRepository.findByConfigKey("snapshot_schedule"))
                .thenReturn(Optional.empty());
        when(scheduleConfigRepository.save(any(ScheduleConfig.class)))
                .thenReturn(defaultConfig)
                .thenReturn(updatedConfig);

        ScheduleConfig result = scheduleConfigService.updateSnapshotConfig(newCronExpression);

        assertNotNull(result);
        assertEquals(newCronExpression, result.getCronExpression());
        verify(scheduleConfigRepository, times(1)).findByConfigKey("snapshot_schedule");
        verify(scheduleConfigRepository, times(2)).save(any(ScheduleConfig.class));
    }

    @Test
    @DisplayName("Should preserve other properties when updating cron expression")
    void testUpdatePreservesOtherProperties() {
        String newCronExpression = "0 30 14 ? * THU";
        ScheduleConfig updatedConfig = ScheduleConfig.builder()
                .id(1L)
                .configKey("snapshot_schedule")
                .cronExpression(newCronExpression)
                .description("Weekly snapshot every Monday at 15:00")
                .enabled(true)
                .build();

        when(scheduleConfigRepository.findByConfigKey("snapshot_schedule"))
                .thenReturn(Optional.of(scheduleConfig));
        when(scheduleConfigRepository.save(any(ScheduleConfig.class)))
                .thenReturn(updatedConfig);

        ScheduleConfig result = scheduleConfigService.updateSnapshotConfig(newCronExpression);

        assertEquals("snapshot_schedule", result.getConfigKey());
        assertEquals("Weekly snapshot every Monday at 15:00", result.getDescription());
        assertTrue(result.getEnabled());
        assertEquals(newCronExpression, result.getCronExpression());
    }

    // ========== TOGGLE SCHEDULE TESTS ==========

    @Test
    @DisplayName("Should enable schedule when currently disabled")
    void testToggleScheduleEnable() {
        scheduleConfig.setEnabled(false);
        ScheduleConfig enabledConfig = ScheduleConfig.builder()
                .id(1L)
                .configKey("snapshot_schedule")
                .cronExpression("0 0 15 ? * MON")
                .description("Weekly snapshot every Monday at 15:00")
                .enabled(true)
                .build();

        when(scheduleConfigRepository.findByConfigKey("snapshot_schedule"))
                .thenReturn(Optional.of(scheduleConfig));
        when(scheduleConfigRepository.save(any(ScheduleConfig.class)))
                .thenReturn(enabledConfig);

        ScheduleConfig result = scheduleConfigService.toggleSchedule(true);

        assertNotNull(result);
        assertTrue(result.getEnabled());
        verify(scheduleConfigRepository, times(1)).findByConfigKey("snapshot_schedule");
        verify(scheduleConfigRepository, times(1)).save(any(ScheduleConfig.class));
    }

    @Test
    @DisplayName("Should disable schedule when currently enabled")
    void testToggleScheduleDisable() {
        ScheduleConfig disabledConfig = ScheduleConfig.builder()
                .id(1L)
                .configKey("snapshot_schedule")
                .cronExpression("0 0 15 ? * MON")
                .description("Weekly snapshot every Monday at 15:00")
                .enabled(false)
                .build();

        when(scheduleConfigRepository.findByConfigKey("snapshot_schedule"))
                .thenReturn(Optional.of(scheduleConfig));
        when(scheduleConfigRepository.save(any(ScheduleConfig.class)))
                .thenReturn(disabledConfig);

        ScheduleConfig result = scheduleConfigService.toggleSchedule(false);

        assertNotNull(result);
        assertFalse(result.getEnabled());
        verify(scheduleConfigRepository, times(1)).findByConfigKey("snapshot_schedule");
        verify(scheduleConfigRepository, times(1)).save(any(ScheduleConfig.class));
    }

    @Test
    @DisplayName("Should create default config and toggle it")
    void testToggleScheduleCreatesDefaultFirst() {
        ScheduleConfig defaultConfig = ScheduleConfig.builder()
                .id(1L)
                .configKey("snapshot_schedule")
                .cronExpression("0 0 15 ? * MON")
                .description("Weekly snapshot every Monday at 15:00")
                .enabled(true)
                .build();

        ScheduleConfig disabledConfig = ScheduleConfig.builder()
                .id(1L)
                .configKey("snapshot_schedule")
                .cronExpression("0 0 15 ? * MON")
                .description("Weekly snapshot every Monday at 15:00")
                .enabled(false)
                .build();

        when(scheduleConfigRepository.findByConfigKey("snapshot_schedule"))
                .thenReturn(Optional.empty());
        when(scheduleConfigRepository.save(any(ScheduleConfig.class)))
                .thenReturn(defaultConfig)
                .thenReturn(disabledConfig);

        ScheduleConfig result = scheduleConfigService.toggleSchedule(false);

        assertNotNull(result);
        assertFalse(result.getEnabled());
        verify(scheduleConfigRepository, times(1)).findByConfigKey("snapshot_schedule");
        verify(scheduleConfigRepository, times(2)).save(any(ScheduleConfig.class));
    }

    @Test
    @DisplayName("Should preserve cron expression when toggling schedule")
    void testTogglePreservesCronExpression() {
        String originalCronExpression = "0 0 15 ? * MON";
        ScheduleConfig disabledConfig = ScheduleConfig.builder()
                .id(1L)
                .configKey("snapshot_schedule")
                .cronExpression(originalCronExpression)
                .description("Weekly snapshot every Monday at 15:00")
                .enabled(false)
                .build();

        when(scheduleConfigRepository.findByConfigKey("snapshot_schedule"))
                .thenReturn(Optional.of(scheduleConfig));
        when(scheduleConfigRepository.save(any(ScheduleConfig.class)))
                .thenReturn(disabledConfig);

        ScheduleConfig result = scheduleConfigService.toggleSchedule(false);

        assertEquals(originalCronExpression, result.getCronExpression());
        assertFalse(result.getEnabled());
    }

    // ========== EDGE CASES AND VALIDATION TESTS ==========

    @Test
    @DisplayName("Should handle multiple consecutive calls to getSnapshotConfig")
    void testMultipleGetSnapshotConfigCalls() {
        when(scheduleConfigRepository.findByConfigKey("snapshot_schedule"))
                .thenReturn(Optional.of(scheduleConfig));

        ScheduleConfig result1 = scheduleConfigService.getSnapshotConfig();
        ScheduleConfig result2 = scheduleConfigService.getSnapshotConfig();

        assertNotNull(result1);
        assertNotNull(result2);
        assertEquals(result1.getConfigKey(), result2.getConfigKey());
        verify(scheduleConfigRepository, times(2)).findByConfigKey("snapshot_schedule");
    }

    @Test
    @DisplayName("Should maintain config key consistency across operations")
    void testConfigKeyConsistency() {
        when(scheduleConfigRepository.findByConfigKey("snapshot_schedule"))
                .thenReturn(Optional.of(scheduleConfig));
        when(scheduleConfigRepository.save(any(ScheduleConfig.class)))
                .thenReturn(scheduleConfig);

        ScheduleConfig getResult = scheduleConfigService.getSnapshotConfig();
        ScheduleConfig updateResult = scheduleConfigService.updateSnapshotConfig("0 0 12 ? * FRI");
        ScheduleConfig toggleResult = scheduleConfigService.toggleSchedule(false);

        assertEquals("snapshot_schedule", getResult.getConfigKey());
        assertEquals("snapshot_schedule", updateResult.getConfigKey());
        assertEquals("snapshot_schedule", toggleResult.getConfigKey());
    }

    @Test
    @DisplayName("Should handle sequential toggle calls")
    void testSequentialToggleCalls() {
        ScheduleConfig disabledOnce = ScheduleConfig.builder()
                .id(1L)
                .configKey("snapshot_schedule")
                .cronExpression("0 0 15 ? * MON")
                .description("Weekly snapshot")
                .enabled(false)
                .build();
        
        ScheduleConfig enabledAgain = ScheduleConfig.builder()
                .id(1L)
                .configKey("snapshot_schedule")
                .cronExpression("0 0 15 ? * MON")
                .description("Weekly snapshot")
                .enabled(true)
                .build();

        when(scheduleConfigRepository.findByConfigKey("snapshot_schedule"))
                .thenReturn(Optional.of(scheduleConfig));
        when(scheduleConfigRepository.save(any(ScheduleConfig.class)))
                .thenReturn(disabledOnce)
                .thenReturn(enabledAgain);

        ScheduleConfig result1 = scheduleConfigService.toggleSchedule(false);
        assertEquals(false, result1.getEnabled());
        
        // Reset and set up for second toggle
        reset(scheduleConfigRepository);
        when(scheduleConfigRepository.findByConfigKey("snapshot_schedule"))
                .thenReturn(Optional.of(disabledOnce));
        when(scheduleConfigRepository.save(any(ScheduleConfig.class)))
                .thenReturn(enabledAgain);
        
        ScheduleConfig result2 = scheduleConfigService.toggleSchedule(true);
        assertEquals(true, result2.getEnabled());
    }

    @Test
    @DisplayName("Should handle cron expression with special characters")
    void testUpdateWithComplexCronExpression() {
        String complexCronExpression = "0 0 0,6,12,18 * * ?";
        ScheduleConfig updatedConfig = ScheduleConfig.builder()
                .id(1L)
                .configKey("snapshot_schedule")
                .cronExpression(complexCronExpression)
                .description("Weekly snapshot every Monday at 15:00")
                .enabled(true)
                .build();

        when(scheduleConfigRepository.findByConfigKey("snapshot_schedule"))
                .thenReturn(Optional.of(scheduleConfig));
        when(scheduleConfigRepository.save(any(ScheduleConfig.class)))
                .thenReturn(updatedConfig);

        ScheduleConfig result = scheduleConfigService.updateSnapshotConfig(complexCronExpression);

        assertEquals(complexCronExpression, result.getCronExpression());
    }

    @Test
    @DisplayName("Should save repository with correct object when updating")
    void testSaveCalledWithCorrectObject() {
        String newCronExpression = "0 0 12 ? * FRI";

        when(scheduleConfigRepository.findByConfigKey("snapshot_schedule"))
                .thenReturn(Optional.of(scheduleConfig));
        when(scheduleConfigRepository.save(any(ScheduleConfig.class)))
                .thenReturn(scheduleConfig);

        scheduleConfigService.updateSnapshotConfig(newCronExpression);

        verify(scheduleConfigRepository).save(argThat(config ->
                config.getConfigKey().equals("snapshot_schedule")
                        && config.getCronExpression().equals(newCronExpression)
        ));
    }

}
