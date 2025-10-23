package com.kozimor.wms.Database.Controller;

import com.kozimor.wms.Database.Model.ReportItem;
import com.kozimor.wms.Database.Service.ReportItemService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/report-items")
public class ReportItemController {

    private final ReportItemService reportItemService;

    public ReportItemController(ReportItemService reportItemService) {
        this.reportItemService = reportItemService;
    }

    /**
     * Create a new report item
     */
    @PostMapping
    public ResponseEntity<ReportItem> createReportItem(@Valid @RequestBody ReportItem reportItem) {
        ReportItem createdItem = reportItemService.createReportItem(reportItem);
        return new ResponseEntity<>(createdItem, HttpStatus.CREATED);
    }

    /**
     * Get report item by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReportItem> getReportItemById(@PathVariable Long id) {
        return reportItemService.getReportItemById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all report items for a specific report
     */
    @GetMapping("/report/{reportId}/all")
    public ResponseEntity<List<ReportItem>> getReportItemsByReportId(@PathVariable Long reportId) {
        List<ReportItem> items = reportItemService.getReportItemsByReportId(reportId);
        return ResponseEntity.ok(items);
    }

    /**
     * Get all report items for a specific report with pagination
     */
    @GetMapping("/report/{reportId}")
    public ResponseEntity<Page<ReportItem>> getReportItemsByReportIdPaginated(
            @PathVariable Long reportId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<ReportItem> items = reportItemService.getReportItemsByReportIdPaginated(reportId, pageable);
        return ResponseEntity.ok(items);
    }

    /**
     * Get all items with critical status
     */
    @GetMapping("/status/critical")
    public ResponseEntity<Page<ReportItem>> getAllCriticalItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ReportItem> items = reportItemService.getAllCriticalItems(pageable);
        return ResponseEntity.ok(items);
    }

    /**
     * Get all items with low status
     */
    @GetMapping("/status/low")
    public ResponseEntity<Page<ReportItem>> getAllLowStockItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ReportItem> items = reportItemService.getAllLowStockItems(pageable);
        return ResponseEntity.ok(items);
    }

    /**
     * Get all items by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<ReportItem>> getItemsByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ReportItem> items = reportItemService.getItemsByStatus(status, pageable);
        return ResponseEntity.ok(items);
    }

    /**
     * Get items by item ID in a specific report
     */
    @GetMapping("/report/{reportId}/item/{itemId}")
    public ResponseEntity<List<ReportItem>> getItemsByReportIdAndItemId(
            @PathVariable Long reportId,
            @PathVariable Long itemId) {
        List<ReportItem> items = reportItemService.getItemsByReportIdAndItemId(reportId, itemId);
        return ResponseEntity.ok(items);
    }

    /**
     * Count items by status in a report
     */
    @GetMapping("/report/{reportId}/count/{status}")
    public ResponseEntity<Integer> countByReportIdAndStatus(
            @PathVariable Long reportId,
            @PathVariable String status) {
        Integer count = reportItemService.countByReportIdAndStatus(reportId, status);
        return ResponseEntity.ok(count);
    }

    /**
     * Update an existing report item
     */
    @PutMapping("/{id}")
    public ResponseEntity<ReportItem> updateReportItem(
            @PathVariable Long id,
            @Valid @RequestBody ReportItem reportItem) {
        try {
            ReportItem updatedItem = reportItemService.updateReportItem(id, reportItem);
            return ResponseEntity.ok(updatedItem);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete a report item
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReportItem(@PathVariable Long id) {
        try {
            reportItemService.deleteReportItem(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete all report items for a specific report
     */
    @DeleteMapping("/report/{reportId}/all")
    public ResponseEntity<Void> deleteAllByReportId(@PathVariable Long reportId) {
        try {
            reportItemService.deleteAllByReportId(reportId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get total count of report items
     */
    @GetMapping("/count")
    public ResponseEntity<Long> getReportItemCount() {
        long count = reportItemService.getReportItemCount();
        return ResponseEntity.ok(count);
    }

    
}
