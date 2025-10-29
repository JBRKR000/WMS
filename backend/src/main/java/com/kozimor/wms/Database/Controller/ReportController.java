package com.kozimor.wms.Database.Controller;

import com.kozimor.wms.Database.Model.Report;
import com.kozimor.wms.Database.Model.DTO.ReportDTO;
import com.kozimor.wms.Database.Model.DTO.ReportItemDTO;
import com.kozimor.wms.Database.Model.DTO.PageResponse;
import com.kozimor.wms.Database.Model.DTO.UserDTO;
import com.kozimor.wms.Database.Service.ReportService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * Create a new report
     */
    @PostMapping
    public ResponseEntity<Report> createReport(@Valid @RequestBody Report report) {
        Report createdReport = reportService.createReport(report);
        return new ResponseEntity<>(createdReport, HttpStatus.CREATED);
    }

    /**
     * Get report by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Report> getReportById(@PathVariable Long id) {
        return reportService.getReportById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all reports with pagination
     */
    @GetMapping
    public ResponseEntity<PageResponse<ReportDTO>> getAllReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<Report> reports = reportService.getAllReports(pageable);
        
        // Convert to DTO
        PageResponse<ReportDTO> response = PageResponse.<ReportDTO>builder()
                .content(reports.getContent().stream()
                        .map(this::convertToDTO)
                        .collect(Collectors.toList()))
                .pageNumber(reports.getNumber())
                .pageSize(reports.getSize())
                .totalElements(reports.getTotalElements())
                .totalPages(reports.getTotalPages())
                .isFirst(reports.isFirst())
                .isLast(reports.isLast())
                .hasNext(reports.hasNext())
                .hasPrevious(reports.hasPrevious())
                .build();
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get reports created by a specific user
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<Report>> getReportsByUserId(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Report> reports = reportService.getReportsByUserId(userId, pageable);
        return ResponseEntity.ok(reports);
    }

    /**
     * Get reports created between two dates
     */
    @GetMapping("/daterange")
    public ResponseEntity<Page<Report>> getReportsByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;
            LocalDateTime start = LocalDateTime.parse(startDate, formatter);
            LocalDateTime end = LocalDateTime.parse(endDate, formatter);

            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<Report> reports = reportService.getReportsByDateRange(start, end, pageable);
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get reports with critical stock items
     */
    @GetMapping("/critical")
    public ResponseEntity<Page<Report>> getReportsWithCriticalItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Report> reports = reportService.getReportsWithCriticalItems(pageable);
        return ResponseEntity.ok(reports);
    }

    /**
     * Get the most recent report
     */
    @GetMapping("/latest")
    public ResponseEntity<Report> getMostRecentReport() {
        Report report = reportService.getMostRecentReport();
        if (report != null) {
            return ResponseEntity.ok(report);
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Update an existing report
     */
    @PutMapping("/{id}")
    public ResponseEntity<Report> updateReport(
            @PathVariable Long id,
            @Valid @RequestBody Report report) {
        try {
            Report updatedReport = reportService.updateReport(id, report);
            return ResponseEntity.ok(updatedReport);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete a report
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        try {
            reportService.deleteReport(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get total count of reports
     */
    @GetMapping("/count")
    public ResponseEntity<Long> getReportCount() {
        long count = reportService.getReportCount();
        return ResponseEntity.ok(count);
    }

    @PostMapping("/snapshot")
    public ResponseEntity<Report> createSnapshot() {
        Report snapshot = reportService.createSnapshot();
        return ResponseEntity.status(HttpStatus.CREATED).body(snapshot);
    }

    /**
     * Convert Report entity to ReportDTO
     */
    private ReportDTO convertToDTO(Report report) {
        return ReportDTO.builder()
                .id(report.getId())
                .totalItemsCount(report.getTotalItemsCount())
                .lowStockCount(report.getLowStockCount())
                .criticalStockCount(report.getCriticalStockCount())
                .okCount(report.getOkCount())
                .createdBy(convertUserToDTO(report.getCreatedBy()))
                .reportItems(report.getReportItems().stream()
                        .map(this::convertReportItemToDTO)
                        .collect(Collectors.toSet()))
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }

    /**
     * Convert ReportItem entity to ReportItemDTO
     */
    private ReportItemDTO convertReportItemToDTO(com.kozimor.wms.Database.Model.ReportItem reportItem) {
        return ReportItemDTO.builder()
                .id(reportItem.getId())
                .itemName(reportItem.getItemName())
                .status(reportItem.getStatus())
                .currentQuantity(reportItem.getWarehouseValue() != null ? reportItem.getWarehouseValue().intValue() : 0)
                .unit(reportItem.getUnit() != null ? reportItem.getUnit().name() : null)
                .lastReceiptDate(reportItem.getLastReceiptDate())
                .lastIssueDate(reportItem.getLastIssueDate())
                .warehouseValue(reportItem.getWarehouseValue())
                .differenceFromPrevious(reportItem.getDifferenceFromPrevious())
                .qrCode(reportItem.getQrCode())
                .createdAt(reportItem.getCreatedAt())
                .build();
    }

    /**
     * Convert User entity to UserDTO
     */
    private UserDTO convertUserToDTO(com.kozimor.wms.Database.Model.User user) {
        if (user == null) return null;
        String roleName = null;
        if (user.getRole() != null) {
            roleName = user.getRole().getRoleName();
        }
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(roleName)
                .build();
    }
}
