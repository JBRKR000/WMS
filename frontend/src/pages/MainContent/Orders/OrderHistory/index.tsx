'use client'

import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { OrderService, type OrderDTO } from '../../../../services/orderService'

const OrdersHistory: FC = () => {
  const [orders, setOrders] = useState<OrderDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('ALL')
  const [searchOrderNumber, setSearchOrderNumber] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)
  const [statusChangeModal, setStatusChangeModal] = useState<{
    orderId: number
    currentStatus: string
    orderNumber: string
  } | null>(null)
  const [changeReason, setChangeReason] = useState('')
  const [orderDetailsModal, setOrderDetailsModal] = useState<OrderDTO | null>(null)
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null)

  const pageSize = 10

  const fetchOrders = async (page: number, status: string) => {
    try {
      setLoading(true)
      setError(null)

      let response
      if (status === 'ALL') {
        response = await OrderService.getAll(page, pageSize)
      } else {
        response = await OrderService.getByStatus(status as 'PENDING' | 'COMPLETED' | 'CANCELLED', page, pageSize)
      }

      setOrders(response.content || [])
      setTotalPages(response.totalPages || 0)
      setCurrentPage(page)
    } catch (err) {
      setError('Nie udało się załadować zamówień')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(0, selectedStatus)
  }, [selectedStatus])

  const handleStatusChange = async (newStatus: 'PENDING' | 'COMPLETED' | 'CANCELLED') => {
    if (!statusChangeModal) return

    try {
      setUpdatingOrderId(statusChangeModal.orderId)
      await OrderService.updateStatus(
        statusChangeModal.orderId,
        newStatus,
        changeReason || undefined
      )

      // Refresh orders
      await fetchOrders(currentPage, selectedStatus)
      setStatusChangeModal(null)
      setChangeReason('')
    } catch (err) {
      console.error('Błąd przy zmianie statusu:', err)
      alert('Nie udało się zmienić statusu zamówienia')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          bg: 'bg-warning-bg',
          text: 'text-warning-text',
          badge: 'bg-yellow-200 text-yellow-800',
          icon: '⏳',
        }
      case 'COMPLETED':
        return {
          bg: 'bg-success-bg',
          text: 'text-success-text',
          badge: 'bg-green-200 text-green-800',
          icon: '✓',
        }
      case 'CANCELLED':
        return {
          bg: 'bg-error-bg',
          text: 'text-error-text',
          badge: 'bg-red-200 text-red-800',
          icon: '✕',
        }
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          badge: 'bg-gray-200 text-gray-800',
          icon: '?',
        }
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const filteredOrders = orders.filter((order) =>
    order.orderNumber?.toLowerCase().includes(searchOrderNumber.toLowerCase())
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-main mb-2">Historia Zamówień</h1>
        <p className="text-secondary">Przeglądaj i zarządzaj wszystkimi zamówieniami</p>
      </div>

      {/* Filters Section */}
      <div className="bg-surface border border-main rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search by Order Number */}
          <div className="flex flex-col">
            <label htmlFor="search" className="text-sm font-medium text-secondary mb-2">
              Szukaj po numerze zamówienia
            </label>
            <input
              id="search"
              type="text"
              placeholder="Wpisz numer zamówienia..."
              value={searchOrderNumber}
              onChange={(e) => setSearchOrderNumber(e.target.value)}
              className="px-4 py-2 border border-main rounded-lg bg-surface text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-col">
            <label htmlFor="status-filter" className="text-sm font-medium text-secondary mb-2">
              Filtruj po statusie
            </label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
              className="px-4 py-2 border border-main rounded-lg bg-surface text-main focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">Wszystkie zamówienia</option>
              <option value="PENDING">Oczekujące</option>
              <option value="COMPLETED">Ukończone</option>
              <option value="CANCELLED">Anulowane</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error-bg border border-error rounded-lg p-4 text-error-text flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-secondary">Ładowanie zamówień...</p>
          </div>
        </div>
      )}

      {/* Orders List */}
      {!loading && filteredOrders.length > 0 && (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusColor = getStatusColor(order.orderStatus || 'PENDING')
            const isExpanded = expandedOrderId === order.id
            return (
              <div
                key={order.id}
                className="bg-surface border border-main rounded-lg overflow-hidden"
              >
                {/* Compact Header - Always Visible */}
                <button
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id || null)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-hover transition-colors text-left border-b border-main"
                >
                  <div className="flex-1 flex items-center gap-4">
                    {/* Order Number and Status */}
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-main">{order.orderNumber}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor.badge} flex items-center gap-1 whitespace-nowrap`}>
                        <span>{statusColor.icon}</span>
                        {order.orderStatus}
                      </span>
                    </div>

                    {/* Creation Date */}
                    <div className="hidden sm:flex items-center gap-2 text-sm text-secondary ml-auto">
                      <span className="text-xs text-muted">Utworzone:</span>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                  </div>

                  {/* Expand/Collapse Arrow */}
                  <div className={`ml-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <span className="text-2xl">▼</span>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="space-y-0">
                    {/* Order Details Grid */}
                    <div className="px-6 py-4 bg-surface-secondary border-b border-main grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* Created By */}
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-secondary uppercase tracking-wide mb-1">Utworzone przez</span>
                        <span className="text-sm text-main font-medium">{order.createdBy || '-'}</span>
                      </div>

                      {/* Item Count */}
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-secondary uppercase tracking-wide mb-1">Ilość pozycji</span>
                        <span className="text-sm text-main font-medium">{order.itemCount || 0}</span>
                      </div>

                      {/* Total Quantity */}
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-secondary uppercase tracking-wide mb-1">Łączna ilość</span>
                        <span className="text-sm text-main font-medium">{order.totalQuantity || 0}</span>
                      </div>

                      {/* Order ID */}
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-secondary uppercase tracking-wide mb-1">ID Zamówienia</span>
                        <span className="text-sm text-main font-medium">#{order.id}</span>
                      </div>
                    </div>

                    {/* Last Update */}
                    <div className="px-6 py-4 bg-surface border-b border-main">
                      <p className="text-xs text-muted mb-1">Ostatnia zmiana</p>
                      <p className="text-sm font-medium text-main">{formatDate(order.updatedAt)}</p>
                    </div>

                    {/* Status Change Buttons */}
                    <div className="px-6 py-3 bg-surface-secondary border-b border-main flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          setStatusChangeModal({
                            orderId: order.id || 0,
                            currentStatus: order.orderStatus || 'PENDING',
                            orderNumber: order.orderNumber || '',
                          })
                        }
                        disabled={updatingOrderId === order.id}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 transition-colors"
                      >
                        ⚙️ Zmień status
                      </button>
                    </div>

                    {/* Description */}
                    {order.description && (
                      <div className="px-6 py-4 bg-surface border-b border-main">
                        <p className="text-sm text-secondary">
                          <span className="font-medium text-main">Opis:</span> {order.description}
                        </p>
                      </div>
                    )}

                    {/* Order Lines Preview */}
                    {order.orderLines && order.orderLines.length > 0 && (
                      <div className="px-6 py-4 bg-surface-secondary border-b border-main">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-main">Pozycje zamówienia:</p>
                          <button
                            onClick={() => setOrderDetailsModal(order)}
                            className="text-xs px-2 py-1 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity"
                          >
                            📋 Podgląd ({order.orderLines.length})
                          </button>
                        </div>
                        <div className="space-y-2">
                          {order.orderLines.slice(0, 3).map((line, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm text-secondary bg-surface rounded px-2 py-1">
                              <span className="flex-1">{line.itemName || `Pozycja ${idx + 1}`}</span>
                              <span className="font-medium text-main">{line.quantity} szt.</span>
                            </div>
                          ))}
                          {order.orderLines.length > 3 && (
                            <div className="text-xs text-muted italic pt-2">
                              ... i {order.orderLines.length - 3} więcej
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredOrders.length === 0 && !error && (
        <div className="bg-surface border border-main rounded-lg p-12 text-center">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-lg font-medium text-main mb-2">Brak zamówień</p>
          <p className="text-secondary">
            {searchOrderNumber ? 'Nie znaleziono zamówień pasujących do kryteriów wyszukiwania' : 'Nie ma jeszcze żadnych zamówień'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
          <button
            onClick={() => fetchOrders(Math.max(0, currentPage - 1), selectedStatus)}
            disabled={currentPage === 0}
            className="px-4 py-2 border border-main rounded-lg text-main disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors"
          >
            ← Wstecz
          </button>

          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: totalPages }, (_, i) => i).map((page) => {
              const isNearCurrent = Math.abs(page - currentPage) <= 2
              const isFirst = page === 0
              const isLast = page === totalPages - 1

              if (!isNearCurrent && !isFirst && !isLast) return null

              return (
                <button
                  key={page}
                  onClick={() => fetchOrders(page, selectedStatus)}
                  className={`min-w-10 h-10 rounded-lg font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-primary text-white'
                      : 'border border-main text-main hover:bg-surface-hover'
                  }`}
                >
                  {page + 1}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => fetchOrders(Math.min(totalPages - 1, currentPage + 1), selectedStatus)}
            disabled={currentPage === totalPages - 1}
            className="px-4 py-2 border border-main rounded-lg text-main disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-hover transition-colors"
          >
            Dalej →
          </button>
        </div>
      )}

      {/* Order Details Modal - Pozycje zamówienia */}
      {orderDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-surface border border-main rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 px-6 py-4 bg-surface border-b border-main flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-main">Pozycje zamówienia</h2>
                <p className="text-sm text-secondary mt-1">Zamówienie: {orderDetailsModal.orderNumber}</p>
              </div>
              <button
                onClick={() => setOrderDetailsModal(null)}
                className="p-1 rounded-lg hover:bg-surface-hover transition-colors text-secondary"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 space-y-4">
              {/* Summary Info */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-surface-secondary rounded-lg border border-main">
                <div>
                  <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-1">Ilość pozycji</p>
                  <p className="text-lg font-semibold text-main">{orderDetailsModal.itemCount || 0}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-1">Razem ilość</p>
                  <p className="text-lg font-semibold text-main">{orderDetailsModal.totalQuantity || 0}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-1">Status</p>
                  <p className="text-lg font-semibold text-main">{orderDetailsModal.orderStatus}</p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h3 className="text-sm font-semibold text-main mb-3">Szczegóły pozycji:</h3>
                {orderDetailsModal.orderLines && orderDetailsModal.orderLines.length > 0 ? (
                  <div className="space-y-3">
                    {orderDetailsModal.orderLines.map((line, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg bg-surface-secondary border border-main hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-main">{line.itemName || `Pozycja ${idx + 1}`}</h4>
                            {line.itemCategory && (
                              <p className="text-xs text-secondary mt-1">Kategoria: {line.itemCategory}</p>
                            )}
                          </div>
                          <span className="text-right">
                            <p className="text-2xl font-bold text-primary">{line.quantity}</p>
                            <p className="text-xs text-secondary">{line.unit || 'szt.'}</p>
                          </span>
                        </div>
                        {line.transactionId && (
                          <p className="text-xs text-muted">ID transakcji: {line.transactionId}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-surface-secondary rounded-lg border border-dashed border-main">
                    <p className="text-secondary">Brak pozycji w zamówieniu</p>
                  </div>
                )}
              </div>

              {/* Total Summary */}
              <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-main">Razem:</span>
                  <span className="text-2xl font-bold text-primary">{orderDetailsModal.totalQuantity || 0} szt.</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 px-6 py-4 bg-surface-secondary border-t border-main flex justify-end">
              <button
                onClick={() => setOrderDetailsModal(null)}
                className="px-4 py-2 rounded-lg border border-main text-main font-medium hover:bg-surface-hover transition-colors"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {statusChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-surface border border-main rounded-lg shadow-xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-main">
              <h2 className="text-lg font-semibold text-main">Zmiana statusu zamówienia</h2>
              <p className="text-sm text-secondary mt-1">Zamówienie: {statusChangeModal.orderNumber}</p>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 space-y-4">
              {/* Current Status */}
              <div>
                <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-2">Aktualny status</p>
                <p className="text-sm font-medium text-main">{statusChangeModal.currentStatus}</p>
              </div>

              {/* New Status Selection */}
              <div>
                <p className="text-xs font-medium text-secondary uppercase tracking-wide mb-3">Nowy status</p>
                <div className="space-y-2">
                  {(['PENDING', 'COMPLETED', 'CANCELLED'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        handleStatusChange(status)
                      }}
                      disabled={status === statusChangeModal.currentStatus || updatingOrderId === statusChangeModal.orderId}
                      className={`w-full px-4 py-3 rounded-lg font-medium transition-colors text-left flex items-center gap-3 ${
                        status === 'PENDING'
                          ? 'bg-warning-bg text-warning-text hover:opacity-90 disabled:opacity-50'
                          : status === 'COMPLETED'
                            ? 'bg-success-bg text-success-text hover:opacity-90 disabled:opacity-50'
                            : 'bg-error-bg text-error-text hover:opacity-90 disabled:opacity-50'
                      }`}
                    >
                      <span className="text-lg">
                        {status === 'PENDING' ? '⏳' : status === 'COMPLETED' ? '✓' : '✕'}
                      </span>
                      <span>{status}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Change Reason */}
              <div>
                <label htmlFor="reason" className="text-xs font-medium text-secondary uppercase tracking-wide mb-2 block">
                  Powód zmiany (opcjonalne)
                </label>
                <textarea
                  id="reason"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Opisz powód zmiany statusu..."
                  rows={3}
                  className="w-full px-3 py-2 border border-main rounded-lg bg-surface text-main text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-main flex gap-3 justify-end">
              <button
                onClick={() => {
                  setStatusChangeModal(null)
                  setChangeReason('')
                }}
                disabled={updatingOrderId !== null}
                className="px-4 py-2 rounded-lg border border-main text-main font-medium hover:bg-surface-hover disabled:opacity-50 transition-colors"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersHistory