import { create } from 'zustand'
import api from '../config/api'
import toast from 'react-hot-toast'

const useUserStore = create((set) => ({
  profile: null,
  preferences: null,
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get('/users/profile')
      set({ profile: data.data, loading: false })
      return data.data
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch profile', loading: false })
      return null
    }
  },

  updateProfile: async (profileData) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.patch('/users/profile', profileData)
      set({ profile: data.data, loading: false })
      // Also update auth store user
      const stored = localStorage.getItem('authUser')
      if (stored) {
        const user = JSON.parse(stored)
        const updated = { ...user, ...data.data }
        localStorage.setItem('authUser', JSON.stringify(updated))
      }
      toast.success('Profile updated successfully!')
      return data.data
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile'
      set({ error: msg, loading: false })
      toast.error(msg)
      return null
    }
  },

  deleteAccount: async () => {
    set({ loading: true, error: null })
    try {
      await api.delete('/users/profile')
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      set({ profile: null, loading: false })
      toast.success('Account deleted')
      return true
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete account'
      set({ error: msg, loading: false })
      toast.error(msg)
      return false
    }
  },

  fetchPreferences: async () => {
    try {
      const { data } = await api.get('/users/preferences')
      set({ preferences: data.data })
      return data.data
    } catch (err) {
      console.error('Failed to fetch preferences')
      return null
    }
  },

  updatePreferences: async (prefs) => {
    try {
      const { data } = await api.patch('/users/preferences', prefs)
      set({ preferences: data.data })
      toast.success('Preferences saved')
      return data.data
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update preferences')
      return null
    }
  },

  reset: () => set({ profile: null, preferences: null, loading: false, error: null }),
}))

export default useUserStore
