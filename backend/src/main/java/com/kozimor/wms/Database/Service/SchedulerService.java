package com.kozimor.wms.Database.Service;

import com.kozimor.wms.Database.Model.Report;
import com.kozimor.wms.Database.Model.User;
import com.kozimor.wms.Database.Repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class SchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(SchedulerService.class);
    private final ReportService reportService;
    private final UserRepository userRepository;

    public SchedulerService(ReportService reportService, UserRepository userRepository) {
        this.reportService = reportService;
        this.userRepository = userRepository;
    }

    @Scheduled(cron = "0 0 15 ? * MON")
    public void weeklySnapshot() {
        try {
            setSystemUser();
            Report snapshot = reportService.createSnapshot();
            logger.info("Weekly snapshot created successfully. Report ID: {}", snapshot.getId());
        } catch (Exception e) {
            logger.error("Error creating weekly snapshot", e);
        }
    }

    private void setSystemUser() {
        User systemUser = userRepository.findByUsername("system")
                .orElseGet(() -> {
                    User newSystemUser = new User();
                    newSystemUser.setUsername("system");
                    newSystemUser.setEmail("system@wms.local");
                    newSystemUser.setPassword("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/tzO");
                    newSystemUser.setFirstName("System");
                    newSystemUser.setLastName("Service");
                    return userRepository.save(newSystemUser);
                });

        Authentication auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                systemUser.getUsername(), null, null);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
