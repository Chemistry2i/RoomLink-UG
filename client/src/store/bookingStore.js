import { create } from 'zustand'

const useBookingStore = create((set) => ({
  checkInDate: null,
  checkOutDate: null,
  guests: 1,
  city: '',

  setCheckInDate: (date) => set({ checkInDate: date }),
  setCheckOutDate: (date) => set({ checkOutDate: date }),
  setGuests: (guests) => set({ guests }),
  setCity: (city) => set({ city }),

  setSearchParams: (params) => set(params),
  clearSearch: () => set({
    checkInDate: null,
    checkOutDate: null,
    guests: 1,
    city: '',
  }),
}))

export default useBookingStore
