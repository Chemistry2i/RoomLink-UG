import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Bed, DollarSign, Users, ToggleLeft, ToggleRight, Edit2, Trash2, X, Image as ImageIcon, UploadCloud } from 'lucide-react'
import { DashboardLayout, DataTable, Modal } from '../../components/dashboard'
import useHostelStore from '../../store/hostelStore'
import api from '../../config/api'
import toast from 'react-hot-toast'
import { hostSidebarItems } from '../../config/sidebarItems'

const ROOM_TYPES = ["Single", "Double", "Twin", "Dorm", "Family", "Suite"]
const BED_CONFIGURATIONS = ["Single Bed", "Double Bed", "Two Single Beds", "Bunk Beds", "Mixed"]
const VIEW_TYPES = ["City View", "Garden View", "Street View", "No View"]
const AMENITIES_LIST = [
  "Private Bathroom", "Shablue Bathroom", "WiFi", "AC", "Fan", "TV",
  "Balcony", "Wardrobe", "Work Desk", "Locker", "Heating",
  "Hot Water", "Hairdryer", "Safe",
]

export default function ManageRooms() {
  const { hostelId } = useParams()
  const navigate = useNavigate()
  const { rooms, loading, fetchRooms, createRoom, updateRoom, deleteRoom, toggleRoomAvailability } = useHostelStore()

  const [hostelName, setHostelName] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ open: false, room: null })

  const [form, setForm] = useState({
    roomNumber: '',
    roomType: 'Single',
    capacity: 1,
    bedConfiguration: 'Single Bed',
    totalBeds: 1,
    pricePerSemester: '',
    totalRooms: 1,
    availableRooms: 1,
    weeklyDiscount: 0,
    monthlyDiscount: 0,
    description: '',
    floor: 0,
    viewType: 'No View',
    amenities: [],
    image: null
  })

  useEffect(() => {
    fetchRooms(hostelId)
    api.get(`/hostels/${hostelId}`).then(({ data }) => {
      setHostelName(data.data?.name || 'Hostel')
    }).catch(() => {})
  }, [hostelId, fetchRooms])

  const resetForm = () => {
    setForm({
      roomNumber: '',
      roomType: 'Single',
      capacity: 1,
      bedConfiguration: 'Single Bed',
      totalBeds: 1,
      pricePerSemester: '',
      totalRooms: 1,
      availableRooms: 1,
      weeklyDiscount: 0,
      monthlyDiscount: 0,
      description: '',
      floor: 0,
      viewType: 'No View',
      amenities: [],
      image: null
    })
    setEditingRoom(null)
  }

  const openCreate = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEdit = (room) => {
    setForm({
      roomNumber: room.roomNumber || '',
      roomType: room.roomType || 'Single',
      capacity: room.capacity || 1,
      bedConfiguration: room.bedConfiguration || 'Single Bed',
      totalBeds: room.totalBeds || 1,
      pricePerSemester: room.pricePerSemester || '',
      totalRooms: room.totalRooms || 1,
      availableRooms: room.availableRooms || 1,
      weeklyDiscount: room.weeklyDiscount || 0,
      monthlyDiscount: room.monthlyDiscount || 0,
      description: room.description || '',
      floor: room.floor || 0,
      viewType: room.viewType || 'No View',
      amenities: room.amenities || [],
      image: null // Cannot set file input value programmatically
    })
    setEditingRoom(room)
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData()


    // Add hostel field as requiblue by backend
    formData.append('hostel', hostelId)

    Object.entries(form).forEach(([key, val]) => {
      if (key === 'amenities' && Array.isArray(val)) {
        val.forEach(item => formData.append('amenities', item))
      } else if (key === 'image' && !val) {
        // skip empty image
      } else {
        formData.append(key, val)
      }
    })

    if (form.image) {
      formData.append('images', form.image)
    }


    // No longer force default inventory; user can set totalRooms and availableRooms
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Rooms</label>
                <input
                  type="number"
                  min="1"
                  value={form.totalRooms}
                  onChange={(e) => setForm({ ...form, totalRooms: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Rooms</label>
                <input
                  type="number"
                  min="0"
                  max={form.totalRooms}
                  value={form.availableRooms}
                  onChange={(e) => setForm({ ...form, availableRooms: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.weeklyDiscount}
                  onChange={(e) => setForm({ ...form, weeklyDiscount: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.monthlyDiscount}
                  onChange={(e) => setForm({ ...form, monthlyDiscount: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400"
                />
              </div>
            </div>
          </>

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
    const newStatus = room.availableRooms > 0 ? 0 : 1
    toggleRoomAvailability(hostelId, room._id, newStatus)
  }

  const handleAmenityToggle = (amenity) => {
    setForm(prev => {
      const exists = prev.amenities.includes(amenity)
      if (exists) return { ...prev, amenities: prev.amenities.filter(a => a !== amenity) }
      return { ...prev, amenities: [...prev.amenities, amenity] }
    })
  }

  const columns = [
    {
      key: 'roomNumber',
      label: 'Room Number',
      sortable: true,
      accessor: 'roomNumber',
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.roomNumber}</p>
          <p className="text-xs text-gray-500 capitalize">{row.roomType}</p>
          <p className="text-xs text-gray-400">{row.viewType}</p>
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
          <span>{row.capacity} ({row.totalBeds} beds)</span>
        </div>
      ),
    },
    {
      key: 'pricePerSemester',
      label: 'Price / Semester',
      accessor: 'pricePerSemester',
      sortable: true,
      render: (row) => (
        <span className="font-semibold">UGX {row.pricePerSemester?.toLocaleString() || '—'}</span>
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
            row.availableRooms > 0
              ? 'bg-green-100 text-green-700'
              : 'bg-sky-100 text-sky-600 border border-sky-200'
          }`}
        >
          {row.availableRooms > 0 ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          {row.availableRooms > 0 ? 'Available' : 'Full'}
        </button>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(row)} className="flex items-center gap-1.5 px-3 py-1.5 text-sky-600 hover:bg-sky-50 rounded-lg border-2 border-sky-200 transition-colors text-xs font-semibold">
            <Edit2 size={14} />
            Edit Room
          </button>
          <button onClick={() => setDeleteModal({ open: true, room: row })} className="flex items-center gap-1.5 px-3 py-1.5 text-sky-600 hover:bg-sky-50 rounded-lg border-2 border-sky-200 transition-colors text-xs font-semibold">
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
        size="lg"
        footer={
          <>
            <button onClick={() => { setModalOpen(false); resetForm() }} className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-sky-500 text-white rounded-lg font-medium border-2 border-sky-500 hover:bg-sky-600 disabled:opacity-50">
              {loading ? 'Saving...' : editingRoom ? 'Update Room' : 'Create Room'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
            <input
              type="text"
              value={form.roomNumber}
              onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400"
              placeholder="e.g., Room 101"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
              <select
                value={form.roomType}
                onChange={(e) => setForm({ ...form, roomType: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400"
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
              <input
                type="number"
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input
                type="number"
                min="1"
                max="20"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bed Configuration</label>
              <select
                value={form.bedConfiguration}
                onChange={(e) => setForm({ ...form, bedConfiguration: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400"
              >
                {BED_CONFIGURATIONS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Beds</label>
              <input
                type="number"
                min="1"
                value={form.totalBeds}
                onChange={(e) => setForm({ ...form, totalBeds: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Image</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-center">
                <UploadCloud className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 font-medium">
                  {form.image ? form.image.name : 'Click to upload room image'}
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Semester (UGX)</label>
            <input
              type="number"
              value={form.pricePerSemester}
              onChange={(e) => setForm({ ...form, pricePerSemester: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400"
              placeholder="e.g., 500000"
              required
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">View Type</label>
              <select
                value={form.viewType}
                onChange={(e) => setForm({ ...form, viewType: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400 mb-3"
              >
                {VIEW_TYPES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg">
               {AMENITIES_LIST.map((amenity) => (
                 <label key={amenity} className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                   <input
                     type="checkbox"
                     checked={form.amenities.includes(amenity)}
                     onChange={() => handleAmenityToggle(amenity)}
                     className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                   />
                   <span>{amenity}</span>
                 </label>
               ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400 resize-none"
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
            <button onClick={handleDelete} className="px-4 py-2 bg-sky-500 text-white rounded-lg font-medium border-2 border-sky-500 hover:bg-sky-600">
              Delete
            </button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{deleteModal.room?.roomNumber || 'this room'}</strong>?
        </p>
      </Modal>

      {/* Table Action Buttons with Text and Border */}
      {/* Update columns actions to include text labels and theme borders */}
    </DashboardLayout>
  )
}
