import { type FC, useEffect, useMemo, useState } from 'react'
import { FileText, AlertCircle, CheckCircle2, AlertTriangle, Eye, X, ChevronLeft, ChevronRight, Loader, Download } from 'lucide-react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { pdf } from '@react-pdf/renderer'

type ReportItem = {
  id: number
  itemName: string
  status: 'OK' | 'LOW' | 'CRITICAL'
  currentQuantity: number
  unit: string
  lastReceiptDate?: string | null
  lastIssueDate?: string | null
  warehouseValue?: number | null
  differenceFromPrevious?: number | null
  qrCode?: string
}

type ReportCreatedBy = {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  role?: string | null
}

type Report = {
  id: number
  totalItemsCount: number
  lowStockCount: number
  criticalStockCount: number
  okCount: number
  createdBy: ReportCreatedBy
  reportItems: ReportItem[]
  createdAt: string
  updatedAt: string
}

type ReportsPageResponse = {
  content: Report[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
  first: boolean
  last: boolean
}

const formatDate = (iso?: string | null) => iso ? new Date(iso).toLocaleString('pl-PL') : '-'

const unitMap: { [key: string]: string } = {
  'PCS': 'szt.',
  'KG': 'kg',
  'LITER': 'l',
  'METER': 'm',
}

const getUnitLabel = (unit: string): string => unitMap[unit] || unit

// Function to convert Polish characters to ASCII equivalents for PDF
const sanitizePolishText = (text: string): string => {
  const polishMap: { [key: string]: string } = {
    ą: 'a',
    ć: 'c',
    ę: 'e',
    ł: 'l',
    ń: 'n',
    ó: 'o',
    ś: 's',
    ź: 'z',
    ż: 'z',
    Ą: 'A',
    Ć: 'C',
    Ę: 'E',
    Ł: 'L',
    Ń: 'N',
    Ó: 'O',
    Ś: 'S',
    Ź: 'Z',
    Ż: 'Z',
  }
  return text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (char) => polishMap[char] || char)
}

const getStatusColor = (status: string): { bg: string; text: string; icon: any } => {
  switch (status) {
    case 'OK':
      return { bg: 'var(--color-success-bg)', text: 'var(--color-success)', icon: <CheckCircle2 className="w-4 h-4" /> }
    case 'LOW':
      return { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)', icon: <AlertTriangle className="w-4 h-4" /> }
    case 'CRITICAL':
      return { bg: 'var(--color-error-bg)', text: 'var(--color-error)', icon: <AlertCircle className="w-4 h-4" /> }
    default:
      return { bg: 'var(--color-surface-secondary)', text: 'var(--color-text)', icon: null }
  }
}

const PDFExport: FC = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [itemsPage, setItemsPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const pageSize = 10
  const itemsPageSize = 5

  // Fetch reports with pagination
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        const authToken = localStorage.getItem('authToken')
        if (!authToken) {
          setError('Brak autoryzacji')
          return
        }

        const res = await fetch(
          `/api/reports?page=${currentPage}&size=${pageSize}&sortBy=createdAt&direction=DESC`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        )

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data: ReportsPageResponse = await res.json()
        setReports(data.content)
        setTotalPages(data.totalPages)
        setHasNext(data.hasNext)
        setHasPrevious(data.hasPrevious)
        setError(null)
      } catch (err) {
        console.error('Error fetching reports:', err)
        setError('Błąd podczas pobierania raportów')
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [currentPage])

  // Calculate report statistics
  const reportStats = useMemo(() => {
    if (!reports.length) return { total: 0, critical: 0, low: 0, ok: 0 }
    
    return {
      total: reports.reduce((sum, r) => sum + r.totalItemsCount, 0),
      critical: reports.reduce((sum, r) => sum + r.criticalStockCount, 0),
      low: reports.reduce((sum, r) => sum + r.lowStockCount, 0),
      ok: reports.reduce((sum, r) => sum + r.okCount, 0),
    }
  }, [reports])

  // Paginate selected report items
  const paginatedItems = useMemo(() => {
    if (!selectedReport?.reportItems) return []
    const start = itemsPage * itemsPageSize
    return selectedReport.reportItems.slice(start, start + itemsPageSize)
  }, [selectedReport, itemsPage])

  const totalItemsPages = useMemo(() => {
    if (!selectedReport?.reportItems) return 0
    return Math.ceil(selectedReport.reportItems.length / itemsPageSize)
  }, [selectedReport])

  const handleDownloadReport = async () => {
    if (!selectedReport) return

    try {
      // Create PDF document structure
      const ReportPDF = () => (
        <Document>
          <Page size="A4" style={{ padding: 40, fontSize: 11, fontFamily: 'Helvetica' }}>
            {/* Title */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
                {sanitizePolishText(`Raport Magazynowy #${selectedReport.id}`)}
              </Text>
              <Text style={{ fontSize: 9, color: '#666' }}>
                {sanitizePolishText(`Data utworzenia: ${formatDate(selectedReport.createdAt)}`)}
              </Text>
              <Text style={{ fontSize: 9, color: '#666' }}>
                {sanitizePolishText(`Utworzony przez: ${selectedReport.createdBy.username}`)}
              </Text>
            </View>

            {/* Statistics */}
            <View style={{ marginBottom: 20, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>
                {sanitizePolishText('Podsumowanie')}
              </Text>
              <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 9 }}>{sanitizePolishText(`Razem pozycji: ${selectedReport.totalItemsCount}`)}</Text>
                <Text style={{ fontSize: 9 }}>{sanitizePolishText(`Stan krytyczny: ${selectedReport.criticalStockCount}`)}</Text>
                <Text style={{ fontSize: 9 }}>{sanitizePolishText(`Stan niski: ${selectedReport.lowStockCount}`)}</Text>
                <Text style={{ fontSize: 9 }}>{sanitizePolishText(`Stan OK: ${selectedReport.okCount}`)}</Text>
              </View>
            </View>

            {/* Items Table Header */}
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>
                {sanitizePolishText(`Pozycje (${selectedReport.reportItems.length})`)}
              </Text>
            </View>

            {/* Items Table */}
            <View style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
              {/* Header Row */}
              <View style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #ddd', paddingBottom: 4, marginBottom: 4, fontWeight: 'bold' }}>
                <Text style={{ flex: 0.8, fontSize: 8 }}>Status</Text>
                <Text style={{ flex: 2.5, fontSize: 8 }}>Nazwa</Text>
                <Text style={{ flex: 0.7, fontSize: 8, textAlign: 'center' }}>Ilosc</Text>
                <Text style={{ flex: 0.6, fontSize: 8, textAlign: 'center' }}>J.</Text>
                <Text style={{ flex: 0.8, fontSize: 8, textAlign: 'center' }}>Zmiana</Text>
              </View>

              {/* Data Rows */}
              {selectedReport.reportItems.map((item) => (
                <View key={item.id} style={{ display: 'flex', flexDirection: 'row', paddingBottom: 4, marginBottom: 4, borderBottom: '1px solid #eee' }}>
                  <Text style={{ flex: 0.8, fontSize: 8 }}>{item.status}</Text>
                  <Text style={{ flex: 2.5, fontSize: 8 }}>{sanitizePolishText(item.itemName)}</Text>
                  <Text style={{ flex: 0.7, fontSize: 8, textAlign: 'center' }}>{item.currentQuantity}</Text>
                  <Text style={{ flex: 0.6, fontSize: 8, textAlign: 'center' }}>{sanitizePolishText(getUnitLabel(item.unit))}</Text>
                  <Text style={{ flex: 0.8, fontSize: 8, textAlign: 'center' }}>
                    {item.differenceFromPrevious !== undefined && item.differenceFromPrevious !== null
                      ? `${item.differenceFromPrevious > 0 ? '+' : ''}${item.differenceFromPrevious}`
                      : '-'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Footer */}
            <View style={{ marginTop: 20, borderTop: '1px solid #ddd', paddingTop: 10, fontSize: 8, color: '#999' }}>
              <Text>
                {sanitizePolishText(`Raport wygenerowany: ${new Date().toLocaleString('pl-PL')}`)}
              </Text>
            </View>
          </Page>
        </Document>
      )

      // Generate and download PDF
      const pdfDocument = <ReportPDF />
      const pdfBlob = await pdf(pdfDocument).toBlob()
      
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `raport_${selectedReport.id}_${new Date().getTime()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error generating PDF:', err)
      setError('Błąd podczas generowania PDF raportu')
    }
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ color: 'var(--color-text)' }} className="text-3xl font-bold">Raporty magazynowe</h1>
          <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm mt-2">
            Przeglądaj i zarządzaj raportami stanów magazynowych
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            backgroundColor: 'var(--color-error-bg)',
            borderColor: 'var(--color-error)',
            color: 'var(--color-error-text)',
          }}
          className="mb-6 p-4 border rounded-lg flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div
          style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderColor: 'var(--color-border)',
          }}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <div style={{ color: 'var(--color-accent)' }} className="text-xs font-semibold">
                Liczba raportów
              </div>
              <div style={{ color: 'var(--color-text)' }} className="text-3xl font-bold mt-2">
                {reports.length}
              </div>
            </div>
            <div style={{ color: 'var(--color-accent)' }}>
              <FileText className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderColor: 'var(--color-border)',
          }}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <div style={{ color: 'var(--color-error)' }} className="text-xs font-semibold">
                Stan KRYTYCZNY
              </div>
              <div style={{ color: 'var(--color-text)' }} className="text-3xl font-bold mt-2">
                {reportStats.critical}
              </div>
            </div>
            <div style={{ color: 'var(--color-error)' }}>
              <AlertCircle className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderColor: 'var(--color-border)',
          }}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <div style={{ color: 'var(--color-warning)' }} className="text-xs font-semibold">
                Stan NISKI
              </div>
              <div style={{ color: 'var(--color-text)' }} className="text-3xl font-bold mt-2">
                {reportStats.low}
              </div>
            </div>
            <div style={{ color: 'var(--color-warning)' }}>
              <AlertTriangle className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface-secondary)',
            borderColor: 'var(--color-border)',
          }}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <div style={{ color: 'var(--color-primary)' }} className="text-xs font-semibold">
                Stan OK
              </div>
              <div style={{ color: 'var(--color-text)' }} className="text-3xl font-bold mt-2">
                {reportStats.ok}
              </div>
            </div>
            <div style={{ color: 'var(--color-primary)' }}>
              <CheckCircle2 className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && !selectedReport ? (
        <div
          style={{ color: 'var(--color-text-secondary)' }}
          className="text-center py-12"
        >
          <div className="inline-block">
            <Loader className="w-8 h-8 animate-spin mb-3 mx-auto" style={{ color: 'currentColor' }} />
            <p>Ładowanie raportów...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Reports List Section */}
          <section
            style={{
              backgroundColor: 'var(--color-surface-secondary)',
              borderColor: 'var(--color-border)',
            }}
            className="border rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ color: 'var(--color-text)' }} className="text-lg font-semibold">
                Lista raportów
              </h2>
              <div style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
                {reports.length} raportów
              </div>
            </div>

            {reports.length === 0 ? (
              <div style={{ color: 'var(--color-text-secondary)' }} className="p-8 text-center">
                Brak raportów
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {reports.map((report, idx) => (
                    <div
                      key={report.id}
                      onClick={() => {
                        setSelectedReport(report)
                        setItemsPage(0)
                      }}
                      style={{
                        backgroundColor: idx % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-secondary)',
                        borderColor: 'var(--color-border)',
                        cursor: 'pointer',
                      }}
                      className="border rounded-lg p-4 hover:shadow-md transition-all hover:opacity-90"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 style={{ color: 'var(--color-text)' }} className="text-lg font-semibold">
                              Raport #{report.id}
                            </h3>
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                              {formatDate(report.createdAt)}
                            </span>
                          </div>
                          <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm mb-3">
                            Utworzony przez: <span style={{ color: 'var(--color-text)' }} className="font-medium">{report.createdBy.username}</span>
                          </p>

                          {/* Status badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div
                              style={{
                                backgroundColor: 'var(--color-surface)',
                                borderColor: 'var(--color-border)',
                              }}
                              className="border rounded-lg px-3 py-1.5 flex items-center gap-1.5"
                            >
                              <span style={{ color: 'var(--color-text)' }} className="text-xs font-semibold">
                                {report.totalItemsCount}
                              </span>
                              <span style={{ color: 'var(--color-text-secondary)' }} className="text-xs">
                                pozycji
                              </span>
                            </div>

                            {report.criticalStockCount > 0 && (
                              <div
                                style={{
                                  backgroundColor: 'var(--color-error-bg)',
                                  borderColor: 'var(--color-error)',
                                }}
                                className="border rounded-lg px-3 py-1.5 flex items-center gap-1.5"
                              >
                                <AlertCircle style={{ color: 'var(--color-error)' }} className="w-3.5 h-3.5" />
                                <span style={{ color: 'var(--color-error)' }} className="text-xs font-semibold">
                                  {report.criticalStockCount} krytycznych
                                </span>
                              </div>
                            )}

                            {report.lowStockCount > 0 && (
                              <div
                                style={{
                                  backgroundColor: 'var(--color-warning-bg)',
                                  borderColor: 'var(--color-warning)',
                                }}
                                className="border rounded-lg px-3 py-1.5 flex items-center gap-1.5"
                              >
                                <AlertTriangle style={{ color: 'var(--color-warning)' }} className="w-3.5 h-3.5" />
                                <span style={{ color: 'var(--color-warning)' }} className="text-xs font-semibold">
                                  {report.lowStockCount} niskich
                                </span>
                              </div>
                            )}

                            {report.okCount > 0 && (
                              <div
                                style={{
                                  backgroundColor: 'var(--color-surface)',
                                  borderColor: 'var(--color-border)',
                                }}
                                className="border rounded-lg px-3 py-1.5 flex items-center gap-1.5"
                              >
                                <CheckCircle2 style={{ color: 'var(--color-primary)' }} className="w-3.5 h-3.5" />
                                <span style={{ color: 'var(--color-primary)' }} className="text-xs font-semibold">
                                  {report.okCount} OK
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedReport(report)
                            setItemsPage(0)
                          }}
                          style={{
                            backgroundColor: 'var(--color-primary)',
                            color: 'var(--color-surface)',
                          }}
                          className="px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity flex-shrink-0"
                        >
                          <Eye className="w-4 h-4" />
                          Szczegóły
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div
                  style={{ borderColor: 'var(--color-border)' }}
                  className="flex items-center justify-between mt-4 pt-4 border-t"
                >
                  <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs">
                    Strona {currentPage + 1} z {totalPages || 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={!hasPrevious}
                      style={{
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-secondary)',
                      }}
                      className="p-1.5 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages || 1) }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          style={{
                            backgroundColor: currentPage === i ? 'var(--color-primary)' : 'var(--color-surface)',
                            color: currentPage === i ? 'var(--color-surface)' : 'var(--color-text)',
                            borderColor: 'var(--color-border)',
                          }}
                          className="px-2.5 py-1 rounded text-xs border hover:opacity-80 transition-opacity"
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={!hasNext}
                      style={{
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-secondary)',
                      }}
                      className="p-1.5 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelectedReport(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
            className="w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-surface)',
              }}
              className="p-4 sm:p-6 flex items-start justify-between flex-shrink-0"
            >
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold">Raport #{selectedReport.id}</h2>
                <div style={{ color: 'var(--color-surface)', opacity: 0.8 }} className="text-xs sm:text-sm mt-1">
                  {formatDate(selectedReport.createdAt)}
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                style={{ color: 'var(--color-surface)', opacity: 0.6 }}
                className="hover:opacity-100 hover:bg-white/10 rounded-lg p-2 transition-all flex-shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div style={{ backgroundColor: 'var(--color-surface)' }} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {/* Report Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div
                  style={{
                    backgroundColor: 'var(--color-surface-secondary)',
                    borderColor: 'var(--color-border)',
                  }}
                  className="border rounded-lg p-3 sm:p-4 text-center"
                >
                  <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold">
                    Razem
                  </div>
                  <div style={{ color: 'var(--color-text)' }} className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                    {selectedReport.totalItemsCount}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--color-error-bg)',
                    borderColor: 'var(--color-error)',
                  }}
                  className="border rounded-lg p-3 sm:p-4 text-center"
                >
                  <div style={{ color: 'var(--color-error)' }} className="text-xs font-semibold">
                    Krytyczne
                  </div>
                  <div style={{ color: 'var(--color-error)' }} className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                    {selectedReport.criticalStockCount}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--color-warning-bg)',
                    borderColor: 'var(--color-warning)',
                  }}
                  className="border rounded-lg p-3 sm:p-4 text-center"
                >
                  <div style={{ color: 'var(--color-warning)' }} className="text-xs font-semibold">
                    Niskie
                  </div>
                  <div style={{ color: 'var(--color-warning)' }} className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                    {selectedReport.lowStockCount}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--color-success-bg)',
                    borderColor: 'var(--color-success)',
                  }}
                  className="border rounded-lg p-3 sm:p-4 text-center"
                >
                  <div style={{ color: 'var(--color-success)' }} className="text-xs font-semibold">
                    OK
                  </div>
                  <div style={{ color: 'var(--color-success)' }} className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                    {selectedReport.okCount}
                  </div>
                </div>
              </div>

              {/* Creator Info */}
              <div
                style={{
                  backgroundColor: 'var(--color-surface-secondary)',
                  borderColor: 'var(--color-border)',
                }}
                className="border rounded-lg p-3 sm:p-4"
              >
                <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs font-semibold mb-2">
                  Utworzony przez
                </div>
                <div style={{ color: 'var(--color-text)' }} className="text-base sm:text-lg font-bold">
                  {selectedReport.createdBy.username}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h3 style={{ color: 'var(--color-text)' }} className="text-base sm:text-lg font-semibold mb-3">
                  Pozycje ({selectedReport.reportItems.length})
                </h3>

                {selectedReport.reportItems.length === 0 ? (
                  <div style={{ color: 'var(--color-text-secondary)' }} className="p-4 text-center text-sm">
                    Brak pozycji w raporcie
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto border rounded-lg" style={{ borderColor: 'var(--color-border)' }}>
                      <table className="min-w-full text-xs sm:text-sm">
                        <thead>
                          <tr
                            style={{
                              color: 'var(--color-text-secondary)',
                              backgroundColor: 'var(--color-surface-secondary)',
                              borderColor: 'var(--color-border)',
                            }}
                            className="text-left border-b"
                          >
                            <th className="px-2 sm:px-3 py-2 font-semibold">Status</th>
                            <th className="px-2 sm:px-3 py-2 font-semibold">Nazwa</th>
                            <th className="px-2 sm:px-3 py-2 font-semibold text-center">Ilość</th>
                            <th className="px-2 sm:px-3 py-2 font-semibold text-center">Jedn.</th>
                            <th className="px-2 sm:px-3 py-2 font-semibold text-center">Zmiana od ostatniego raportu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedItems.map((item, idx) => {
                            const statusInfo = getStatusColor(item.status)
                            return (
                              <tr
                                key={item.id}
                                style={{
                                  borderColor: 'var(--color-border)',
                                  backgroundColor:
                                    idx % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-secondary)',
                                }}
                                className="border-t"
                              >
                                <td className="px-2 sm:px-3 py-2 text-center">
                                  <div
                                    style={{
                                      backgroundColor: statusInfo.bg,
                                      borderColor: statusInfo.text,
                                      color: statusInfo.text,
                                    }}
                                    className="inline-flex items-center justify-center p-1 border rounded"
                                  >
                                    {statusInfo.icon}
                                  </div>
                                </td>
                                <td style={{ color: 'var(--color-text)' }} className="px-2 sm:px-3 py-2 font-medium">
                                  {item.itemName}
                                </td>
                                <td
                                  style={{ color: 'var(--color-text)' }}
                                  className="px-2 sm:px-3 py-2 text-center font-semibold"
                                >
                                  {item.currentQuantity}
                                </td>
                                <td
                                  style={{ color: 'var(--color-text-secondary)' }}
                                  className="px-2 sm:px-3 py-2 text-center text-xs"
                                >
                                  {getUnitLabel(item.unit)}
                                </td>
                                <td
                                  style={{
                                    color: (item.differenceFromPrevious ?? 0) > 0 ? 'var(--color-success)' : 'var(--color-error)',
                                  }}
                                  className="px-2 sm:px-3 py-2 text-center font-bold"
                                >
                                  {item.differenceFromPrevious !== undefined && item.differenceFromPrevious !== null
                                    ? `${item.differenceFromPrevious > 0 ? '+' : ''}${item.differenceFromPrevious}`
                                    : '-'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Items Pagination */}
                    {totalItemsPages > 1 && (
                      <div
                        style={{ borderColor: 'var(--color-border)' }}
                        className="flex items-center justify-between mt-3 pt-3 border-t gap-2"
                      >
                        <div style={{ color: 'var(--color-text-secondary)' }} className="text-xs">
                          Strona {itemsPage + 1}/{totalItemsPages}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setItemsPage((p) => Math.max(0, p - 1))}
                            disabled={itemsPage === 0}
                            style={{
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-text-secondary)',
                            }}
                            className="p-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          {Array.from({ length: Math.min(3, totalItemsPages) }, (_, i) => (
                            <button
                              key={i}
                              onClick={() => setItemsPage(i)}
                              style={{
                                backgroundColor: itemsPage === i ? 'var(--color-primary)' : 'var(--color-surface)',
                                color: itemsPage === i ? 'var(--color-surface)' : 'var(--color-text)',
                                borderColor: 'var(--color-border)',
                              }}
                              className="px-2 py-1 rounded text-xs border hover:opacity-80 transition-opacity"
                            >
                              {i + 1}
                            </button>
                          ))}
                          <button
                            onClick={() => setItemsPage((p) => Math.min(totalItemsPages - 1, p + 1))}
                            disabled={itemsPage === totalItemsPages - 1}
                            style={{
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-text-secondary)',
                            }}
                            className="p-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-secondary)',
                borderColor: 'var(--color-border)',
              }}
              className="border-t px-4 sm:px-6 py-3 sm:py-4 flex justify-end gap-3 flex-shrink-0"
            >
              <button
                onClick={() => setSelectedReport(null)}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)',
                }}
                className="px-3 sm:px-4 py-2 rounded-lg border font-medium text-sm hover:opacity-80 transition-opacity"
              >
                Zamknij
              </button>
              <button
                onClick={handleDownloadReport}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-surface)',
                }}
                className="px-3 sm:px-4 py-2 rounded-lg font-medium text-sm hover:opacity-80 transition-opacity inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Pobierz
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default PDFExport
