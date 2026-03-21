import { create } from 'zustand'
import api from '../config/api'
import toast from 'react-hot-toast'

const useHostelStore = create((set, get) => ({
  hostels: [],
  selectedHostel: null,
  rooms: [],
  bookings: [],
  reviews: [],
  loading: false,
  error: null,
  pagination: { page: 1, totalPages: 1, total: 0 },

  // ─── Host Hostels ────────────────────────────────
  fetchMyHostels: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get('/hostels?mine=true')
      set({ hostels: data.data?.hostels || data.data || [], loading: false })
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch hostels', loading: false })
    }
  },

  createHostel: async (formData) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/hostels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      set((state) => ({ hostels: [...state.hostels, data.data], loading: false }))
      toast.success('Hostel created successfully!')
      return data.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create hostel'
      set({ error: msg, loading: false })
      toast.error(msg)
      return null
    }
  },

  updateHostel: async (id, formData) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.put(`/hostels/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      set((state) => ({
        hostels: state.hostels.map((h) => (h._id === id ? data.data : h)),
        selectedHostel: data.data,
        loading: false,
      }))
      toast.success('Hostel updated successfully!')
      return data.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update hostel'
      set({ error: msg, loading: false })
      toast.error(msg)
      return null
    }
  },

  deleteHostel: async (id) => {
    try {
      await api.delete(`/hostels/${id}`)
      set((state) => ({
        hostels: state.hostels.filter((h) => h._id !== id),
      }))
      toast.success('Hostel deleted')
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete hostel')
      return false
    }
  },

  // ─── Rooms ───────────────────────────────────────
  fetchRooms: async (hostelId) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get(`/hostels/${hostelId}/rooms`)
      set({ rooms: data.data?.rooms || data.data || [], loading: false })
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch rooms', loading: false })
    }
  },

  createRoom: async (hostelId, formData) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post(`/hostels/${hostelId}/rooms`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      set((state) => ({ rooms: [...state.rooms, data.data], loading: false }))
      toast.success('Room created successfully!')
      return data.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create room'
      set({ error: msg, loading: false })
      toast.error(msg)
      return null
    }
  },

  updateRoom: async (hostelId, roomId, formData) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.patch(`/hostels/${hostelId}/rooms/${roomId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      set((state) => ({
        rooms: state.rooms.map((r) => (r._id === roomId ? data.data : r)),
        loading: false,
      }))
      toast.success('Room updated!')
      return data.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update room'
      set({ error: msg, loading: false })
      toast.error(msg)
      return null
    }
  },

  deleteRoom: async (hostelId, roomId) => {
    try {
      await api.delete(`/hostels/${hostelId}/rooms/${roomId}`)
      set((state) => ({
        rooms: state.rooms.filter((r) => r._id !== roomId),
      }))
      toast.success('Room deleted')
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete room')
      return false
    }
  },

  toggleRoomAvailability: async (hostelId, roomId, available) => {
    try {
      await api.patch(`/hostels/${hostelId}/rooms/${roomId}/availability`, { available })
      set((state) => ({
        rooms: state.rooms.map((r) =>
          r._id === roomId ? { ...r, available } : r
        ),
      }))
      toast.success(`Room ${available ? 'enabled' : 'disabled'}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update availability')
    }
  },

  // ─── Host Bookings ───────────────────────────────
  fetchHostBookings: async (page = 1, status = '') => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams({ page, limit: 20 })
      if (status) params.append('status', status)
      const { data } = await api.get(`/bookings?${params}`)
      set({
        bookings: data.data?.bookings || data.data || [],
        pagination: data.data?.pagination || { page, totalPages: 1, total: 0 },
        loading: false,
      })
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch bookings', loading: false })
    }
  },

  // ─── Host Reviews ────────────────────────────────
  fetchHostelReviews: async (hostelId) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get(`/reviews/hostel/${hostelId}`)
      set({ reviews: data.data?.reviews || data.data || [], loading: false })
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch reviews', loading: false })
    }
  },

  // ─── Reset ───────────────────────────────────────
  reset: () => set({
    hostels: [],
    selectedHostel: null,
    rooms: [],
    bookings: [],
    reviews: [],
    loading: false,
    error: null,
  }),
}))

export default useHostelStore
