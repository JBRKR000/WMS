package com.kozimor.wms.Database.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kozimor.wms.Database.Model.Report;
import java.time.LocalDateTime;

public interface ReportRepository extends JpaRepository<Report, Long> {

    /**
     * Find all reports created by a specific user
     */
    @EntityGraph(attributePaths = {"createdBy", "reportItems"})
    Page<Report> findAllByCreatedBy_Id(Long userId, Pageable pageable);

    /**
     * Find reports created between two dates
     */
    @EntityGraph(attributePaths = {"createdBy", "reportItems"})
    @Query("SELECT r FROM Report r WHERE r.createdAt BETWEEN :startDate AND :endDate ORDER BY r.createdAt DESC")
    Page<Report> findReportsByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    /**
     * Find all reports with pagination and eager loading
     */
    @EntityGraph(attributePaths = {"createdBy", "reportItems"})
    @Query("SELECT r FROM Report r ORDER BY r.createdAt DESC")
    Page<Report> findAllWithDetails(Pageable pageable);

    /**
     * Find reports with critical stock items
     */
    @EntityGraph(attributePaths = {"createdBy", "reportItems"})
    @Query("SELECT r FROM Report r WHERE r.criticalStockCount > 0 ORDER BY r.createdAt DESC")
    Page<Report> findReportsWithCriticalItems(Pageable pageable);

    /**
     * Find most recent report
     */
    @EntityGraph(attributePaths = {"createdBy", "reportItems"})
    @Query("SELECT r FROM Report r ORDER BY r.createdAt DESC LIMIT 1")
    Report findMostRecentReport();
}
