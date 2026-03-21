import { create } from 'zustand'
import api from '../config/api'
import toast from 'react-hot-toast'

const useComplaintStore = create((set) => ({
  complaints: [],
  selectedComplaint: null,
  loading: false,
  error: null,
  pagination: { page: 1, totalPages: 1, total: 0 },

  fetchComplaints: async (page = 1, status = '') => {
    set({ loading: true, error: null })
    try {
      const params = new URLSearchParams({ page, limit: 20 })
      if (status) params.append('status', status)
      const { data } = await api.get(`/complaints?${params}`)
      set({
        complaints: data.data?.complaints || data.data || [],
        pagination: data.data?.pagination || { page, totalPages: 1, total: 0 },
        loading: false,
      })
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch complaints', loading: false })
    }
  },

  fetchComplaint: async (id) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get(`/complaints/${id}`)
      set({ selectedComplaint: data.data, loading: false })
      return data.data
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch complaint', loading: false })
      return null
    }
  },

  createComplaint: async (complaintData) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/complaints', complaintData)
      set((state) => ({ complaints: [data.data, ...state.complaints], loading: false }))
      toast.success('Complaint submitted successfully!')
      return data.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit complaint'
      set({ error: msg, loading: false })
      toast.error(msg)
      return null
    }
  },

  updateStatus: async (id, status) => {
    try {
      const { data } = await api.patch(`/complaints/${id}/status`, { status })
      set((state) => ({
        complaints: state.complaints.map((c) => (c._id === id ? data.data : c)),
        selectedComplaint: state.selectedComplaint?._id === id ? data.data : state.selectedComplaint,
      }))
      toast.success('Status updated')
      return data.data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
      return null
    }
  },

  resolveComplaint: async (id, resolution) => {
    try {
      const { data } = await api.patch(`/complaints/${id}/resolve`, { resolution })
      set((state) => ({
        complaints: state.complaints.map((c) => (c._id === id ? data.data : c)),
        selectedComplaint: state.selectedComplaint?._id === id ? data.data : state.selectedComplaint,
      }))
      toast.success('Complaint resolved')
      return data.data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve complaint')
      return null
    }
  },

  escalateComplaint: async (id, reason) => {
    try {
      const { data } = await api.patch(`/complaints/${id}/escalate`, { reason })
      set((state) => ({
        complaints: state.complaints.map((c) => (c._id === id ? data.data : c)),
        selectedComplaint: state.selectedComplaint?._id === id ? data.data : state.selectedComplaint,
      }))
      toast.success('Complaint escalated')
      return data.data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to escalate complaint')
      return null
    }
  },

  addNote: async (id, note) => {
    try {
      const { data } = await api.patch(`/complaints/${id}/note`, { note })
      set((state) => ({
        selectedComplaint: state.selectedComplaint?._id === id ? data.data : state.selectedComplaint,
      }))
      toast.success('Note added')
      return data.data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add note')
      return null
    }
  },

  reset: () => set({
    complaints: [],
    selectedComplaint: null,
    loading: false,
    error: null,
  }),
}))

export default useComplaintStore
