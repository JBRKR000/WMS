package com.kozimor.wms.Database.Service;

import com.kozimor.wms.Database.Model.ReportItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface ReportItemService {

    /**
     * Create a new report item
     */
    ReportItem createReportItem(ReportItem reportItem);

    /**
     * Get report item by ID
     */
    Optional<ReportItem> getReportItemById(Long id);

    /**
     * Get all report items for a specific report
     */
    List<ReportItem> getReportItemsByReportId(Long reportId);

    /**
     * Get all report items for a specific report with pagination
     */
    Page<ReportItem> getReportItemsByReportIdPaginated(Long reportId, Pageable pageable);

    /**
     * Get all items with critical status
     */
    Page<ReportItem> getAllCriticalItems(Pageable pageable);

    /**
     * Get all items with low status
     */
    Page<ReportItem> getAllLowStockItems(Pageable pageable);

    /**
     * Get all items by status
     */
    Page<ReportItem> getItemsByStatus(String status, Pageable pageable);

    /**
     * Get items by item ID in a specific report
     */
    List<ReportItem> getItemsByReportIdAndItemId(Long reportId, Long itemId);

    /**
     * Count items by status in a report
     */
    Integer countByReportIdAndStatus(Long reportId, String status);

    /**
     * Update an existing report item
     */
    ReportItem updateReportItem(Long id, ReportItem reportItem);

    /**
     * Delete a report item
     */
    void deleteReportItem(Long id);

    /**
     * Get total count of report items
     */
    long getReportItemCount();

    /**
     * Delete all report items for a specific report
     */
    void deleteAllByReportId(Long reportId);
}
