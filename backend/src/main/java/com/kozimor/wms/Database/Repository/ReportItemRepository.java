package com.kozimor.wms.Database.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.kozimor.wms.Database.Model.ReportItem;
import java.util.List;

public interface ReportItemRepository extends JpaRepository<ReportItem, Long> {

    /**
     * Find all items for a specific report
     */
    @EntityGraph(attributePaths = {"report", "item"})
    List<ReportItem> findAllByReport_Id(Long reportId);

    /**
     * Find all items for a specific report with pagination
     */
    @EntityGraph(attributePaths = {"report", "item"})
    Page<ReportItem> findAllByReport_Id(Long reportId, Pageable pageable);

    /**
     * Find all items with critical status
     */
    @EntityGraph(attributePaths = {"report", "item"})
    @Query("SELECT ri FROM ReportItem ri WHERE ri.status = 'CRITICAL' ORDER BY ri.createdAt DESC")
    Page<ReportItem> findAllCriticalItems(Pageable pageable);

    /**
     * Find all items with low status
     */
    @EntityGraph(attributePaths = {"report", "item"})
    @Query("SELECT ri FROM ReportItem ri WHERE ri.status = 'LOW' ORDER BY ri.createdAt DESC")
    Page<ReportItem> findAllLowStockItems(Pageable pageable);

    /**
     * Find items by status
     */
    @EntityGraph(attributePaths = {"report", "item"})
    Page<ReportItem> findAllByStatus(String status, Pageable pageable);

    /**
     * Find items by item ID in a specific report
     */
    @EntityGraph(attributePaths = {"report", "item"})
    List<ReportItem> findAllByReport_IdAndItem_Id(Long reportId, Long itemId);

    /**
     * Count items by status in a report
     */
    @Query("SELECT COUNT(ri) FROM ReportItem ri WHERE ri.report.id = :reportId AND ri.status = :status")
    Integer countByReportIdAndStatus(@Param("reportId") Long reportId, @Param("status") String status);
}
