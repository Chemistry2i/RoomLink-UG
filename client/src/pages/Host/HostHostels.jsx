import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MapPin, Star, Edit2, Trash2, Eye, Building2 } from 'lucide-react'
import { DashboardLayout, DataTable, Modal } from '../../components/dashboard'
import useHostelStore from '../../store/hostelStore'
import useAuthStore from '../../store/authStore'
import { hostSidebarItems } from '../../config/sidebarItems'

export default function HostHostels() {
  const { user } = useAuthStore()
  const { hostels, loading, fetchMyHostels, deleteHostel } = useHostelStore()
  const [deleteModal, setDeleteModal] = useState({ open: false, hostel: null })

  useEffect(() => {
    fetchMyHostels()
  }, [fetchMyHostels])

  const handleDelete = async () => {
    if (deleteModal.hostel) {
      const success = await deleteHostel(deleteModal.hostel._id)
      if (success) setDeleteModal({ open: false, hostel: null })
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Hostel',
      sortable: true,
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {row.images?.[0]?.url ? (
              <img src={row.images[0].url} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 size={20} className="text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{row.name}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin size={12} /> {row.city || row.location || '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'rooms',
      label: 'Rooms',
      accessor: (row) => row.totalRooms || 0,
      sortable: true,
    },
    {
      key: 'rating',
      label: 'Rating',
      accessor: 'averageRating',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1">
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
          <span>{row.averageRating?.toFixed(1) || '—'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
          row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-sky-100 text-sky-700 border border-sky-200'
        }`}>
          {row.status || 'active'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/hostel/${row._id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sky-600 hover:bg-sky-50 rounded-lg border-2 border-sky-200 transition-colors text-xs font-semibold"
            title="View"
          >
            <Eye size={14} />
            View
          </Link>
          <Link
            to={`/host/hostels/${row._id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sky-600 hover:bg-sky-50 rounded-lg border-2 border-sky-200 transition-colors text-xs font-semibold"
            title="Edit"
          >
            <Edit2 size={14} />
            Edit
          </Link>
          <Link
            to={`/host/hostels/${row._id}/rooms`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sky-600 hover:bg-sky-50 rounded-lg border-2 border-sky-200 transition-colors text-xs font-semibold"
            title="Manage Rooms"
          >
            <Building2 size={14} />
            Rooms
          </Link>
          <button
            onClick={() => setDeleteModal({ open: true, hostel: row })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sky-600 hover:bg-sky-50 rounded-lg border-2 border-sky-200 transition-colors text-xs font-semibold"
            title="Delete"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout sidebarItems={hostSidebarItems} sidebarHeader="Host Panel">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Hostels</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your hostel listings</p>
        </div>
        <Link
          to="/host/add-hostel"
          className="flex items-center gap-2 btn-primary px-5 py-2.5"
        >
          <Plus size={18} />
          Add Hostel
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={hostels}
        searchable
        searchPlaceholder="Search hostels..."
        emptyIcon={Building2}
        emptyTitle="No hostels yet"
        emptyDescription="Create your first hostel listing to get started."
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, hostel: null })}
        title="Delete Hostel"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDeleteModal({ open: false, hostel: null })}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-sky-500 text-white rounded-lg font-medium border-2 border-sky-500 hover:bg-sky-600"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{deleteModal.hostel?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </DashboardLayout>
  )
}
