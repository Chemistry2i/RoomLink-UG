import { useState, useEffect } from 'react'
import { Eye, CheckCircle, XCircle, LogIn, LogOut as LogOutIcon } from 'lucide-react'
import api from '../../config/api'
import toast from 'react-hot-toast'
import { DashboardLayout, DataTable, Modal } from '../../components/dashboard'
import { adminSidebarItems } from '../../config/sidebarItems'

const statusConfig = {
  pending:    { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
  confirmed:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Confirmed' },
  checked_in: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Checked In' },
  completed:  { bg: 'bg-gray-100',   text: 'text-gray-700',   label: 'Completed' },
  cancelled:  { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Cancelled' },
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: '200' })
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const { data } = await api.get(`/bookings?${params}`)
      setBookings(data.data?.bookings || data.data || [])
    } catch (error) {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [statusFilter])

  const handleAction = async (bookingId, action) => {
    setActionLoading(true)
    try {
      await api.post(`/bookings/${bookingId}/${action}`)
      toast.success(`Booking ${action} successful`)
      setSelectedBooking(null)
      fetchBookings()
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} booking`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async (bookingId) => {
    setActionLoading(true)
    try {
      await api.put(`/bookings/${bookingId}`, { status: 'cancelled' })
      toast.success('Booking cancelled')
      setSelectedBooking(null)
      fetchBookings()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking')
    } finally {
      setActionLoading(false)
    }
  }

  const columns = [
    {
      header: 'Booking #',
      accessor: 'bookingNumber',
      render: (row) => (
        <span className="font-mono text-sm font-medium">
          {row.bookingNumber || row._id?.slice(0, 8)}
        </span>
      ),
    },
    {
      header: 'Guest',
      accessor: 'user',
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.user?.name || 'N/A'}</p>
          <p className="text-xs text-gray-500">{row.user?.email || ''}</p>
        </div>
      ),
    },
    {
      header: 'Hostel / Room',
      accessor: 'hostel',
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.hostel?.name || row.room?.hostel?.name || 'N/A'}</p>
          <p className="text-xs text-gray-500">{row.room?.roomType || ''}</p>
        </div>
      ),
    },
    {
      header: 'Dates',
      accessor: 'checkInDate',
      render: (row) => (
        <div className="text-xs">
          <p>{new Date(row.checkInDate).toLocaleDateString()}</p>
          <p className="text-gray-500">to {new Date(row.checkOutDate).toLocaleDateString()}</p>
        </div>
      ),
    },
    {
      header: 'Amount',
      accessor: 'totalPrice',
      render: (row) => (
        <span className="text-sm font-bold">${row.totalPrice?.toLocaleString() || 0}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const cfg = statusConfig[row.status] || statusConfig.pending
        return (
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
        )
      },
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedBooking(row)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="View details"
          >
            <Eye size={16} />
          </button>
          {row.status === 'confirmed' && (
            <button
              onClick={() => handleAction(row._id, 'checkin')}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
              title="Check In"
            >
              <LogIn size={16} />
            </button>
          )}
          {row.status === 'checked_in' && (
            <button
              onClick={() => handleAction(row._id, 'checkout')}
              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"
              title="Check Out"
            >
              <LogOutIcon size={16} />
            </button>
          )}
          {(row.status === 'pending' || row.status === 'confirmed') && (
            <button
              onClick={() => handleCancel(row._id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
              title="Cancel"
            >
              <XCircle size={16} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout sidebarItems={adminSidebarItems} sidebarHeader="Admin Panel">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Manage Bookings</h1>
        <p className="text-gray-600 text-sm mt-1">View and manage all platform bookings</p>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'pending', 'confirmed', 'checked_in', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              statusFilter === status
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status === 'all' ? 'All' : (statusConfig[status]?.label || status)}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        emptyMessage="No bookings found"
        searchable
        searchKeys={['bookingNumber']}
      />

      {/* Booking Detail Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title={`Booking #${selectedBooking?.bookingNumber || selectedBooking?._id?.slice(0, 8)}`}
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium">Guest</p>
                <p className="font-semibold">{selectedBooking.user?.name || 'N/A'}</p>
                <p className="text-sm text-gray-500">{selectedBooking.user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Status</p>
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold mt-1 ${
                  (statusConfig[selectedBooking.status] || statusConfig.pending).bg
                } ${(statusConfig[selectedBooking.status] || statusConfig.pending).text}`}>
                  {(statusConfig[selectedBooking.status] || statusConfig.pending).label}
                </span>
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
                <p className="text-xl font-bold">${selectedBooking.totalPrice?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Room Type</p>
                <p className="font-medium">{selectedBooking.room?.roomType || 'N/A'}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              {selectedBooking.status === 'confirmed' && (
                <button
                  onClick={() => handleAction(selectedBooking._id, 'checkin')}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  Check In
                </button>
              )}
              {selectedBooking.status === 'checked_in' && (
                <button
                  onClick={() => handleAction(selectedBooking._id, 'checkout')}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <LogOutIcon size={16} />
                  Check Out
                </button>
              )}
              {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                <button
                  onClick={() => handleCancel(selectedBooking._id)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Cancel
                </button>
              )}
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
