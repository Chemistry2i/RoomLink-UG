import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Bed, DollarSign, Users, ToggleLeft, ToggleRight, Edit2, Trash2, X } from 'lucide-react'
import { DashboardLayout, DataTable, Modal } from '../../components/dashboard'
import useHostelStore from '../../store/hostelStore'
import api from '../../config/api'
import toast from 'react-hot-toast'
import { hostSidebarItems } from '../../config/sidebarItems'

const ROOM_TYPES = ['single', 'double', 'triple', 'quad', 'dormitory']

export default function ManageRooms() {
  const { hostelId } = useParams()
  const navigate = useNavigate()
  const { rooms, loading, fetchRooms, createRoom, updateRoom, deleteRoom, toggleRoomAvailability } = useHostelStore()

  const [hostelName, setHostelName] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ open: false, room: null })

  const [form, setForm] = useState({
    name: '', type: 'single', capacity: 1, price: '', description: '',
  })

  useEffect(() => {
    fetchRooms(hostelId)
    api.get(`/hostels/${hostelId}`).then(({ data }) => {
      setHostelName(data.data?.name || 'Hostel')
    }).catch(() => {})
  }, [hostelId, fetchRooms])

  const resetForm = () => {
    setForm({ name: '', type: 'single', capacity: 1, price: '', description: '' })
    setEditingRoom(null)
  }

  const openCreate = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEdit = (room) => {
    setForm({
      name: room.name || '',
      type: room.type || 'single',
      capacity: room.capacity || 1,
      price: room.price || '',
      description: room.description || '',
    })
    setEditingRoom(room)
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    Object.entries(form).forEach(([key, val]) => formData.append(key, val))

    if (editingRoom) {
      const result = await updateRoom(hostelId, editingRoom._id, formData)
      if (result) { setModalOpen(false); resetForm() }
    } else {
      const result = await createRoom(hostelId, formData)
      if (result) { setModalOpen(false); resetForm() }
    }
  }

  const handleDelete = async () => {
    if (deleteModal.room) {
      const success = await deleteRoom(hostelId, deleteModal.room._id)
      if (success) setDeleteModal({ open: false, room: null })
    }
  }

  const handleToggle = (room) => {
    toggleRoomAvailability(hostelId, room._id, !room.available)
  }

  const columns = [
    {
      key: 'name',
      label: 'Room',
      sortable: true,
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.name || `Room ${row._id?.slice(-4)}`}</p>
          <p className="text-xs text-gray-500 capitalize">{row.type}</p>
        </div>
      ),
    },
    {
      key: 'capacity',
      label: 'Capacity',
      accessor: 'capacity',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Users size={14} className="text-gray-400" />
          <span>{row.capacity} {row.capacity === 1 ? 'person' : 'people'}</span>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      accessor: 'price',
      sortable: true,
      render: (row) => (
        <span className="font-semibold">${row.price?.toLocaleString() || '—'}</span>
      ),
    },
    {
      key: 'available',
      label: 'Available',
      accessor: 'available',
      render: (row) => (
        <button
          onClick={() => handleToggle(row)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
            row.available !== false
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-600'
          }`}
        >
          {row.available !== false ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          {row.available !== false ? 'Yes' : 'No'}
        </button>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(row)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Edit2 size={16} />
          </button>
          <button onClick={() => setDeleteModal({ open: true, room: row })} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout sidebarItems={hostSidebarItems} sidebarHeader="Host Panel">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Rooms</h1>
          <p className="text-sm text-gray-500 mt-1">{hostelName}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 btn-primary px-5 py-2.5">
          <Plus size={18} />
          Add Room
        </button>
      </div>

      <DataTable
        columns={columns}
        data={rooms}
        searchable
        searchPlaceholder="Search rooms..."
        emptyIcon={Bed}
        emptyTitle="No rooms yet"
        emptyDescription="Add your first room to this hostel."
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm() }}
        title={editingRoom ? 'Edit Room' : 'Add Room'}
        size="md"
        footer={
          <>
            <button onClick={() => { setModalOpen(false); resetForm() }} className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
              {loading ? 'Saving...' : editingRoom ? 'Update Room' : 'Create Room'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              placeholder="e.g., Room 101"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input
                type="number"
                min="1"
                max="20"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price per Semester</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              placeholder="e.g., 800000"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
              placeholder="Room features, bed type, etc."
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, room: null })}
        title="Delete Room"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteModal({ open: false, room: null })} className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
              Delete
            </button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{deleteModal.room?.name || 'this room'}</strong>?
        </p>
      </Modal>
    </DashboardLayout>
  )
}
