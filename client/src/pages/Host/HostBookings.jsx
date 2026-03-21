import { useEffect, useState } from 'react'
import { CalendarDays, Eye, CheckCircle, XCircle, Clock, Download } from 'lucide-react'
import { DashboardLayout, DataTable, Modal } from '../../components/dashboard'
import useHostelStore from '../../store/hostelStore'
import { hostSidebarItems } from '../../config/sidebarItems'

const STATUS_STYLES = {
  confirmed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Confirmed' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Pending' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Cancelled' },
  checked_in: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle, label: 'Checked In' },
  completed: { bg: 'bg-gray-100', text: 'text-gray-700', icon: CheckCircle, label: 'Completed' },
}

function exportCSV(bookings) {
  const headers = ['Booking #', 'Guest', 'Email', 'Check-in', 'Check-out', 'Amount', 'Status']
  const rows = bookings.map((b) => [
    b.bookingNumber || b._id?.slice(-8),
    b.user?.name || b.userName || '',
    b.user?.email || b.userEmail || '',
    new Date(b.checkInDate).toLocaleDateString(),
    new Date(b.checkOutDate).toLocaleDateString(),
    b.totalPrice || 0,
    b.status || '',
  ])
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function HostBookings() {
  const { bookings, pagination, loading, fetchHostBookings } = useHostelStore()
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)

  useEffect(() => {
    fetchHostBookings(1, statusFilter)
  }, [fetchHostBookings, statusFilter])

  const columns = [
    {
      key: 'bookingNumber',
      label: 'Booking #',
      sortable: true,
      accessor: (row) => row.bookingNumber || row._id?.slice(-8),
      render: (row) => (
        <span className="font-mono text-sm font-semibold">
          {row.bookingNumber || row._id?.slice(-8)}
        </span>
      ),
    },
    {
      key: 'guest',
      label: 'Guest',
      accessor: (row) => row.user?.name || row.userName || '—',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.user?.name || row.userName || '—'}</p>
          <p className="text-xs text-gray-500">{row.user?.email || row.userEmail || ''}</p>
        </div>
      ),
    },
    {
      key: 'dates',
      label: 'Dates',
      accessor: 'checkInDate',
      render: (row) => (
        <div className="text-sm">
          <p>{new Date(row.checkInDate).toLocaleDateString()}</p>
          <p className="text-gray-400">to {new Date(row.checkOutDate).toLocaleDateString()}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      accessor: 'totalPrice',
      sortable: true,
      render: (row) => (
        <span className="font-semibold">${row.totalPrice?.toLocaleString() || '0'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      accessor: 'status',
      render: (row) => {
        const style = STATUS_STYLES[row.status] || STATUS_STYLES.pending
        const Icon = style.icon
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
            <Icon size={12} />
            {style.label || row.status}
          </span>
        )
      },
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <button
          onClick={() => setSelectedBooking(row)}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="View details"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ]

  return (
    <DashboardLayout sidebarItems={hostSidebarItems} sidebarHeader="Host Panel">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage booking requests</p>
        </div>
        {bookings.length > 0 && (
          <button
            onClick={() => exportCSV(bookings)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {['', 'pending', 'confirmed', 'checked_in', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              statusFilter === status
                ? 'bg-red-50 border-red-300 text-red-600'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status ? status.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase()) : 'All'}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        searchable
        searchPlaceholder="Search bookings..."
        emptyIcon={CalendarDays}
        emptyTitle="No bookings"
        emptyDescription={statusFilter ? `No ${statusFilter} bookings found.` : 'No bookings yet.'}
      />

      {/* Booking Detail Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title={`Booking #${selectedBooking?.bookingNumber || selectedBooking?._id?.slice(-8)}`}
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium">Guest</p>
                <p className="font-semibold">{selectedBooking.user?.name || selectedBooking.userName || '—'}</p>
                <p className="text-sm text-gray-500">{selectedBooking.user?.email || selectedBooking.userEmail || ''}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Status</p>
                {(() => {
                  const style = STATUS_STYLES[selectedBooking.status] || STATUS_STYLES.pending
                  return (
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold mt-1 ${style.bg} ${style.text}`}>
                      {style.label || selectedBooking.status}
                    </span>
                  )
                })()}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Check-in</p>
                <p className="font-medium">{new Date(selectedBooking.checkInDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Check-out</p>
                <p className="font-medium">{new Date(selectedBooking.checkOutDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Amount</p>
                <p className="text-xl font-bold">${selectedBooking.totalPrice?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Room</p>
                <p className="font-medium">{selectedBooking.room?.name || selectedBooking.room?.roomType || '—'}</p>
              </div>
            </div>

            {selectedBooking.hostel && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Hostel</p>
                <p className="font-medium">{selectedBooking.hostel?.name || '—'}</p>
              </div>
            )}

            {selectedBooking.specialRequests && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium mb-1">Special Requests</p>
                <p className="text-sm text-gray-600">{selectedBooking.specialRequests}</p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
