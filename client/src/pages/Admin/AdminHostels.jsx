import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Star, MapPin, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../../config/api'
import toast from 'react-hot-toast'
import { DashboardLayout, DataTable, Modal } from '../../components/dashboard'
import { adminSidebarItems } from '../../config/sidebarItems'

export default function AdminHostels() {
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchHostels = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/hostels?limit=200')
      setHostels(data.data?.hostels || data.data || [])
    } catch (error) {
      toast.error('Failed to load hostels')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHostels()
  }, [])

  const handleDelete = async () => {
    if (!deleteModal) return
    setDeleting(true)
    try {
      await api.delete(`/hostels/${deleteModal._id}`)
      toast.success('Hostel deleted')
      setDeleteModal(null)
      fetchHostels()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete hostel')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      header: 'Hostel',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {row.images?.[0]?.url ? (
              <img src={row.images[0].url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 size={18} className="text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{row.name}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin size={12} />
              {row.city}, {row.country}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Owner',
      accessor: 'owner',
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.owner?.name || 'N/A'}</p>
          <p className="text-xs text-gray-500">{row.owner?.email || ''}</p>
        </div>
      ),
    },
    {
      header: 'Rating',
      accessor: 'averageRating',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Star size={14} className="fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">
            {row.averageRating?.toFixed(1) || 'New'}
          </span>
          <span className="text-xs text-gray-500">({row.totalReviews || 0})</span>
        </div>
      ),
    },
    {
      header: 'Price',
      accessor: 'minPrice',
      render: (row) => (
        <span className="text-sm font-semibold">
          {row.minPrice ? `$${row.minPrice}` : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const active = row.status === 'active' || row.isActive !== false
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {active ? <ToggleRight size={12}/> : <ToggleLeft size={12}/>}
            {active ? 'Active' : 'Inactive'}
          </span>
        )
      },
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/hostel/${row._id}`}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View"
          >
            <Eye size={16} />
          </Link>
          <button
            onClick={() => setDeleteModal(row)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout sidebarItems={adminSidebarItems} sidebarHeader="Admin Panel">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Manage Hostels</h1>
        <p className="text-gray-600 text-sm mt-1">
          {hostels.length} hostel{hostels.length !== 1 ? 's' : ''} registered
        </p>
      </div>

      <DataTable
        columns={columns}
        data={hostels}
        loading={loading}
        emptyMessage="No hostels found"
        searchable
        searchKeys={['name', 'city', 'country']}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Hostel"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{deleteModal?.name}</strong>? This action cannot be undone and will remove all associated rooms and bookings.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteModal(null)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Hostel'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
