package com.kozimor.wms.Database.Service.ServiceImpl;

import com.kozimor.wms.Database.Model.*;
import com.kozimor.wms.Database.Repository.*;
import com.kozimor.wms.Database.Service.ReportService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final ItemRepository itemRepository;
    private final ReportItemRepository reportItemRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public ReportServiceImpl(ReportRepository reportRepository,
            ItemRepository itemRepository,
            ReportItemRepository reportItemRepository,
            TransactionRepository transactionRepository,
            UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.itemRepository = itemRepository;
        this.reportItemRepository = reportItemRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Report createReport(Report report) {
        return reportRepository.save(report);
    }

    @Override
    public Optional<Report> getReportById(Long id) {
        return reportRepository.findById(id);
    }

    @Override
    public Page<Report> getAllReports(Pageable pageable) {
        return reportRepository.findAllWithDetails(pageable);
    }

    @Override
    public Page<Report> getReportsByUserId(Long userId, Pageable pageable) {
        return reportRepository.findAllByCreatedBy_Id(userId, pageable);
    }

    @Override
    public Page<Report> getReportsByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return reportRepository.findReportsByDateRange(startDate, endDate, pageable);
    }

    @Override
    public Page<Report> getReportsWithCriticalItems(Pageable pageable) {
        return reportRepository.findReportsWithCriticalItems(pageable);
    }

    @Override
    public Report getMostRecentReport() {
        return reportRepository.findMostRecentReport();
    }

    @Override
    public Report updateReport(Long id, Report reportDetails) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Report not found with id: " + id));

        report.setTotalItemsCount(reportDetails.getTotalItemsCount());
        report.setLowStockCount(reportDetails.getLowStockCount());
        report.setCriticalStockCount(reportDetails.getCriticalStockCount());
        report.setOkCount(reportDetails.getOkCount());
        report.setCreatedBy(reportDetails.getCreatedBy());

        return reportRepository.save(report);
    }

    @Override
    public void deleteReport(Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Report not found with id: " + id));
        reportRepository.delete(report);
    }

    @Override
    public long getReportCount() {
        return reportRepository.count();
    }

    @Override
    public Report createSnapshot() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + username));

        List<Item> allItems = itemRepository.findAll();

        int totalItemsCount = allItems.size();
        int lowStockCount = 0;
        int criticalStockCount = 0;
        int okCount = 0;

        Report report = Report.builder()
                .totalItemsCount(totalItemsCount)
                .lowStockCount(0)
                .criticalStockCount(0)
                .okCount(0)
                .createdBy(currentUser)
                .build();

        Report savedReport = reportRepository.save(report);

        Report previousReport = getPreviousReport(savedReport.getId());

        List<ReportItem> reportItems = new ArrayList<>();

        for (Item item : allItems) {
            String status = calculateStatus(item);

            switch (status) {
                case "LOW" -> lowStockCount++;
                case "CRITICAL" -> criticalStockCount++;
                case "OK" -> okCount++;
            }

            LocalDateTime lastReceiptDate = getLastReceiptDate(item);
            LocalDateTime lastIssueDate = getLastIssueDate(item);
            Integer differenceFromPrevious = calculateDifference(previousReport, item);

            ReportItem reportItem = ReportItem.builder()
                    .report(savedReport)
                    .item(item)
                    .itemName(item.getName())
                    .status(status)
                    .lastReceiptDate(lastReceiptDate)
                    .lastIssueDate(lastIssueDate)
                    .warehouseValue((double) item.getCurrentQuantity())
                    .unit(item.getUnit())
                    .qrCode(item.getQrCode())
                    .differenceFromPrevious(differenceFromPrevious)
                    .build();

            reportItems.add(reportItem);
        }

        reportItemRepository.saveAll(reportItems);

        report.setLowStockCount(lowStockCount);
        report.setCriticalStockCount(criticalStockCount);
        report.setOkCount(okCount);

        return reportRepository.save(report);
    }

    private Report getPreviousReport(Long currentReportId) {
        try {
            return reportRepository.findAllWithDetails(Pageable.unpaged())
                    .stream()
                    .filter(r -> r.getId() < currentReportId)
                    .sorted(Comparator.comparing(Report::getId).reversed())
                    .findFirst()
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private Integer calculateDifference(Report previousReport, Item item) {
        if (previousReport == null) {
            return 0;
        }

        try {
            ReportItem previousReportItem = previousReport.getReportItems()
                    .stream()
                    .filter(ri -> ri.getItem().getId().equals(item.getId()))
                    .findFirst()
                    .orElse(null);

            if (previousReportItem == null) {
                return 0;
            }

            return (int) (item.getCurrentQuantity() - previousReportItem.getWarehouseValue());
        } catch (Exception e) {
            return 0;
        }
    }

    private String calculateStatus(Item item) {
        // Status based on current quantity only (thresholds now managed at Location level)
        if (item.getCurrentQuantity() == null) {
            return "OK";
        }

        long currentQty = item.getCurrentQuantity();

        if (currentQty <= 0) {
            return "CRITICAL";
        } else if (currentQty <= 10) {
            return "LOW";
        }

        return "OK";
    }

    private LocalDateTime getLastReceiptDate(Item item) {
        try {
            return transactionRepository.findByItemId(item.getId())
                    .stream()
                    .filter(t -> t.getTransactionType() == TransactionType.RECEIPT)
                    .map(t -> {
                        if (t.getTransactionDate() != null) {
                            return t.getTransactionDate().toLocalDateTime();
                        }
                        return null;
                    })
                    .filter(java.util.Objects::nonNull)
                    .max(Comparator.naturalOrder())
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDateTime getLastIssueDate(Item item) {
        try {
            return transactionRepository.findByItemId(item.getId())
                    .stream()
                    .filter(t -> t.getTransactionType() == TransactionType.ISSUE_TO_PRODUCTION
                            || t.getTransactionType() == TransactionType.ISSUE_TO_SALES
                            || t.getTransactionType() == TransactionType.ORDER)
                    .map(t -> {
                        if (t.getTransactionDate() != null) {
                            return t.getTransactionDate().toLocalDateTime();
                        }
                        return null;
                    })
                    .filter(java.util.Objects::nonNull)
                    .max(Comparator.naturalOrder())
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}
