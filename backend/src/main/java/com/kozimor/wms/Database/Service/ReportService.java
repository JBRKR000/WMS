package com.kozimor.wms.Database.Service;

import com.kozimor.wms.Database.Model.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Optional;

public interface ReportService {

    /**
     * Create a new report
     */
    Report createReport(Report report);

    /**
     * Get report by ID
     */
    Optional<Report> getReportById(Long id);

    /**
     * Get all reports with pagination
     */
    Page<Report> getAllReports(Pageable pageable);

    /**
     * Get reports created by a specific user
     */
    Page<Report> getReportsByUserId(Long userId, Pageable pageable);

    /**
     * Get reports created between two dates
     */
    Page<Report> getReportsByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    /**
     * Get reports with critical stock items
     */
    Page<Report> getReportsWithCriticalItems(Pageable pageable);

    /**
     * Get the most recent report
     */
    Report getMostRecentReport();

    /**
     * Update an existing report
     */
    Report updateReport(Long id, Report report);

    /**
     * Delete a report by ID
     */
    void deleteReport(Long id);

    /**
     * Get total count of reports
     */
    long getReportCount();


    /**
     * Create a snapshot report of the current inventory state
     */
    Report createSnapshot();
}
