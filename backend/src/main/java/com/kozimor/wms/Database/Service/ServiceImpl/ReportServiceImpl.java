package com.kozimor.wms.Database.Service.ServiceImpl;

import com.kozimor.wms.Database.Model.Report;
import com.kozimor.wms.Database.Repository.ReportRepository;
import com.kozimor.wms.Database.Service.ReportService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;

    public ReportServiceImpl(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
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
}
