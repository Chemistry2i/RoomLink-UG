import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem('authUser')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })(),
  token: localStorage.getItem('authToken'),
  isLoading: false,
  error: null,

  setUser: (user) => {
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user))
    } else {
      localStorage.removeItem('authUser')
    }
    set({ user })
  },
  setToken: (token) => {
    if (token) {
      localStorage.setItem('authToken', token)
    } else {
      localStorage.removeItem('authToken')
    }
    set({ token })
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  logout: () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    set({ user: null, token: null })
  },

  isAuthenticated: () => !!localStorage.getItem('authToken'),
}))

export default useAuthStore
