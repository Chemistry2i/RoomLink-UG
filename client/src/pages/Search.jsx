import { useState, useEffect } from 'react'
import { MapPin, Star, DollarSign } from 'lucide-react'
import HostelCard from '../components/HostelCard'
import useBookingStore from '../store/bookingStore'
import api from '../config/api'
import toast from 'react-hot-toast'

export default function Search() {
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    priceMin: 0,
    priceMax: 200,
    rating: 0,
    amenities: [],
  })

  const { city, checkInDate, checkOutDate } = useBookingStore()

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const params = new URLSearchParams()
        if (city) params.append('city', city)
        if (filters.priceMin) params.append('priceMin', filters.priceMin)
        if (filters.priceMax) params.append('priceMax', filters.priceMax)
        if (filters.rating) params.append('minRating', filters.rating)
        if (filters.amenities.length > 0) params.append('amenities', filters.amenities.join(','))

        const { data } = await api.get(`/hostels/search?${params}`)
        setHostels(data.data || [])
      } catch (error) {
        // Fallback: try the general hostels endpoint
        try {
          const { data } = await api.get('/hostels')
          let results = data.data?.hostels || data.data || []
          // Client-side filtering as fallback
          if (city) results = results.filter(h => h.city?.toLowerCase().includes(city.toLowerCase()))
          if (filters.priceMax) results = results.filter(h => (h.minPrice || 0) <= filters.priceMax)
          if (filters.rating) results = results.filter(h => (h.averageRating || 0) >= filters.rating)
          if (filters.amenities.length > 0) {
            results = results.filter(h =>
              filters.amenities.every(a => h.amenities?.map(am => am.toLowerCase()).includes(a.toLowerCase()))
            )
          }
          setHostels(results)
        } catch {
          toast.error('Failed to search hostels')
        }
      } finally {
        setLoading(false)
      }
    }

    setLoading(true)
    fetchHostels()
  }, [filters, city])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-max py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-20">
              <h3 className="font-bold text-lg mb-6">Filters</h3>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3">Price Range</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-gray-400" />
                    <input
                      type="range"
                      min="0"
                      max="300"
                      value={filters.priceMax}
                      onChange={(e) =>
                        setFilters({ ...filters, priceMax: parseInt(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    ${filters.priceMin} - ${filters.priceMax}
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3">Minimum Rating</label>
                <div className="space-y-2">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <label key={rating} className="flex items-center text-sm">
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={filters.rating === rating}
                        onChange={() => setFilters({ ...filters, rating })}
                        className="mr-2"
                      />
                      {rating === 0 ? 'Any' : `${rating}+ ⭐`}
                    </label>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-semibold mb-3">Amenities</label>
                <div className="space-y-2 text-sm">
                  {['WiFi', 'Kitchen', 'Laundry', 'Parking', 'Pool', 'Security', 'Study Room'].map((amenity) => (
                    <label key={amenity} className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={filters.amenities.includes(amenity)}
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            amenities: e.target.checked
                              ? [...prev.amenities, amenity]
                              : prev.amenities.filter(a => a !== amenity)
                          }))
                        }}
                      />
                      {amenity}
                    </label>
                  ))}
                </div>
              </div>

              {/* Reset Filters */}
              {(filters.priceMax !== 200 || filters.rating !== 0 || filters.amenities.length > 0) && (
                <button
                  onClick={() => setFilters({ priceMin: 0, priceMax: 200, rating: 0, amenities: [] })}
                  className="w-full mt-4 text-sm text-red-500 hover:text-red-700 font-semibold"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">
                {city ? `Hostels in ${city}` : 'Search Results'}
              </h2>
              {checkInDate && checkOutDate && (
                <p className="text-gray-600">
                  {new Date(checkInDate).toLocaleDateString()} -{' '}
                  {new Date(checkOutDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Hostels Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="card h-96 bg-gray-200 animate-pulse" />
                ))}
              </div>
            ) : hostels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hostels.map((hostel) => (
                  <HostelCard key={hostel._id} hostel={hostel} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No hostels found matching your search</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
