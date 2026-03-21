import { create } from 'zustand'
import api from '../config/api'
import toast from 'react-hot-toast'

const useReviewStore = create((set) => ({
  reviews: [],
  loading: false,
  error: null,

  fetchHostelReviews: async (hostelId) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get(`/reviews/hostel/${hostelId}`)
      set({ reviews: data.data?.reviews || data.data || [], loading: false })
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch reviews', loading: false })
    }
  },

  createReview: async (reviewData) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/reviews', reviewData)
      set((state) => ({ reviews: [data.data, ...state.reviews], loading: false }))
      toast.success('Review submitted successfully!')
      return data.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit review'
      set({ error: msg, loading: false })
      toast.error(msg)
      return null
    }
  },

  updateReview: async (id, reviewData) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.patch(`/reviews/${id}`, reviewData)
      set((state) => ({
        reviews: state.reviews.map((r) => (r._id === id ? data.data : r)),
        loading: false,
      }))
      toast.success('Review updated!')
      return data.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update review'
      set({ error: msg, loading: false })
      toast.error(msg)
      return null
    }
  },

  deleteReview: async (id) => {
    try {
      await api.delete(`/reviews/${id}`)
      set((state) => ({
        reviews: state.reviews.filter((r) => r._id !== id),
      }))
      toast.success('Review deleted')
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete review')
      return false
    }
  },

  reset: () => set({ reviews: [], loading: false, error: null }),
}))

export default useReviewStore
