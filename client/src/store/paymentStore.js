import { create } from 'zustand'
import api from '../config/api'
import toast from 'react-hot-toast'

const usePaymentStore = create((set) => ({
  payments: [],
  currentPayment: null,
  loading: false,
  error: null,

  initiatePayment: async (paymentData) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/payments/initiate', paymentData)
      set({ currentPayment: data.data, loading: false })
      toast.success('Payment initiated')
      return data.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment initiation failed'
      set({ error: msg, loading: false })
      toast.error(msg)
      return null
    }
  },

  checkStatus: async (paymentId) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get(`/payments/status/${paymentId}`)
      set({ currentPayment: data.data, loading: false })
      return data.data
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to check payment status', loading: false })
      return null
    }
  },

  fetchHistory: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get('/payments/history')
      set({ payments: data.data?.payments || data.data || [], loading: false })
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch payment history', loading: false })
    }
  },

  requestRefund: async (refundData) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/payments/refund', refundData)
      toast.success('Refund request submitted')
      set({ loading: false })
      return data.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Refund request failed'
      set({ error: msg, loading: false })
      toast.error(msg)
      return null
    }
  },

  reset: () => set({ payments: [], currentPayment: null, loading: false, error: null }),
}))

export default usePaymentStore
