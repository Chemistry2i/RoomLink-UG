import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Users, Search } from 'lucide-react'
import useBookingStore from '../store/bookingStore'

export default function SearchBar() {
  const navigate = useNavigate()
  const { setSearchParams } = useBookingStore()
  const [city, setCity] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)

  const handleSearch = (e) => {
    e.preventDefault()
    if (!city) return

    setSearchParams({
      city,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      guests,
    })

    navigate('/search')
  }

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white rounded-full shadow-xl p-2 flex flex-col sm:flex-row gap-2"
    >
      {/* Location */}
      <div className="flex items-center flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200">
        <MapPin size={20} className="text-gray-400 mr-3" />
        <input
          type="text"
          placeholder="Where are you going?"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full outline-none text-sm font-medium text-gray-900 bg-transparent placeholder-gray-500"
        />
      </div>

      {/* Check-in */}
      <div className="flex items-center flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200">
        <Calendar size={20} className="text-gray-400 mr-3" />
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="w-full outline-none text-sm font-medium text-gray-900 bg-transparent placeholder-gray-500"
        />
      </div>

      {/* Check-out */}
      <div className="flex items-center flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200">
        <Calendar size={20} className="text-gray-400 mr-3" />
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full outline-none text-sm font-medium text-gray-900 bg-transparent placeholder-gray-500"
        />
      </div>

      {/* Guests */}
      <div className="flex items-center flex-1 px-4 py-3 sm:border-r border-gray-200">
        <Users size={20} className="text-gray-400 mr-3" />
        <input
          type="number"
          min="1"
          max="10"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className="w-full outline-none text-sm font-medium text-gray-900 bg-transparent placeholder-gray-500"
        />
      </div>

      {/* Search Button */}
      <button
        type="submit"
        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        <Search size={18} />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  )
}
