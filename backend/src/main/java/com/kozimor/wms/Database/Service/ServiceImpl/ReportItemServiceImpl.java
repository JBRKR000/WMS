package com.kozimor.wms.Database.Service.ServiceImpl;

import com.kozimor.wms.Database.Model.ReportItem;
import com.kozimor.wms.Database.Repository.ReportItemRepository;
import com.kozimor.wms.Database.Service.ReportItemService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ReportItemServiceImpl implements ReportItemService {

    private final ReportItemRepository reportItemRepository;

    public ReportItemServiceImpl(ReportItemRepository reportItemRepository) {
        this.reportItemRepository = reportItemRepository;
    }

    @Override
    public ReportItem createReportItem(ReportItem reportItem) {
        return reportItemRepository.save(reportItem);
    }

    @Override
    public Optional<ReportItem> getReportItemById(Long id) {
        return reportItemRepository.findById(id);
    }

    @Override
    public List<ReportItem> getReportItemsByReportId(Long reportId) {
        return reportItemRepository.findAllByReport_Id(reportId);
    }

    @Override
    public Page<ReportItem> getReportItemsByReportIdPaginated(Long reportId, Pageable pageable) {
        return reportItemRepository.findAllByReport_Id(reportId, pageable);
    }

    @Override
    public Page<ReportItem> getAllCriticalItems(Pageable pageable) {
        return reportItemRepository.findAllCriticalItems(pageable);
    }

    @Override
    public Page<ReportItem> getAllLowStockItems(Pageable pageable) {
        return reportItemRepository.findAllLowStockItems(pageable);
    }

    @Override
    public Page<ReportItem> getItemsByStatus(String status, Pageable pageable) {
        return reportItemRepository.findAllByStatus(status, pageable);
    }

    @Override
    public List<ReportItem> getItemsByReportIdAndItemId(Long reportId, Long itemId) {
        return reportItemRepository.findAllByReport_IdAndItem_Id(reportId, itemId);
    }

    @Override
    public Integer countByReportIdAndStatus(Long reportId, String status) {
        return reportItemRepository.countByReportIdAndStatus(reportId, status);
    }

    @Override
    public ReportItem updateReportItem(Long id, ReportItem reportItemDetails) {
        ReportItem reportItem = reportItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ReportItem not found with id: " + id));

        reportItem.setItemName(reportItemDetails.getItemName());
        reportItem.setStatus(reportItemDetails.getStatus());
        reportItem.setLastReceiptDate(reportItemDetails.getLastReceiptDate());
        reportItem.setLastIssueDate(reportItemDetails.getLastIssueDate());
        reportItem.setWarehouseValue(reportItemDetails.getWarehouseValue());
        reportItem.setDifferenceFromPrevious(reportItemDetails.getDifferenceFromPrevious());
        reportItem.setUnit(reportItemDetails.getUnit());
        reportItem.setQrCode(reportItemDetails.getQrCode());

        return reportItemRepository.save(reportItem);
    }

    @Override
    public void deleteReportItem(Long id) {
        ReportItem reportItem = reportItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ReportItem not found with id: " + id));
        reportItemRepository.delete(reportItem);
    }

    @Override
    public long getReportItemCount() {
        return reportItemRepository.count();
    }

    @Override
    public void deleteAllByReportId(Long reportId) {
        List<ReportItem> items = reportItemRepository.findAllByReport_Id(reportId);
        reportItemRepository.deleteAll(items);
    }
}
