import { fetchApi } from '../utils/api';

export interface ReportItem {
  id: number;
  item: {
    id: number;
    name: string;
  };
  itemName: string;
  currentQuantity: number;
  status: 'OK' | 'LOW' | 'CRITICAL';
  lastReceiptDate?: string;
  lastIssueDate?: string;
  warehouseValue: number;
  differenceFromPrevious?: number;
  unit: string;
  qrCode?: string;
}

export interface ReportCreatedBy {
  id: number;
  username: string;
}

export interface Report {
  id: number;
  totalItemsCount: number;
  lowStockCount: number;
  criticalStockCount: number;
  okCount: number;
  createdAt: string;
  createdBy: ReportCreatedBy;
  reportItems: ReportItem[];
}

export interface ReportsPageResponse {
  content: Report[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const ReportService = {
  getAllReports: (page: number = 0, size: number = 10, sortBy: string = 'createdAt', direction: string = 'DESC') =>
    fetchApi<ReportsPageResponse>(`/reports?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`),

  getReportById: (id: number) =>
    fetchApi<Report>(`/reports/${id}`),

  getReportsByDateRange: (startDate: string, endDate: string, page: number = 0, size: number = 10) =>
    fetchApi<ReportsPageResponse>(`/reports/daterange?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&page=${page}&size=${size}`),

  getReportsWithCriticalItems: (page: number = 0, size: number = 10) =>
    fetchApi<ReportsPageResponse>(`/reports/critical?page=${page}&size=${size}`),

  getMostRecentReport: () =>
    fetchApi<Report>('/reports/latest'),

  createSnapshot: () =>
    fetchApi<Report>('/reports/snapshot', { method: 'POST' }),
};
