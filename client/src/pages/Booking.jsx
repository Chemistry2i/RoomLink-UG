import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'
import api from '../config/api'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function Booking() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bookingData, setBookingData] = useState({
    checkInDate: '',
    checkOutDate: '',
    guestCount: 1,
    specialRequests: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchRoom = async () => {
      try {
        const { data } = await api.get(`/rooms/${roomId}`)
        setRoom(data.data)
      } catch (error) {
        toast.error('Failed to load room details')
      } finally {
        setLoading(false)
      }
    }

    fetchRoom()
  }, [roomId, user, navigate])

  const calculateTotal = () => {
    if (!bookingData.checkInDate || !bookingData.checkOutDate || !room) return 0
    const nights = Math.ceil(
      (new Date(bookingData.checkOutDate) - new Date(bookingData.checkInDate)) /
        (1000 * 60 * 60 * 24)
    )
    return nights * room.pricePerNight
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data } = await api.post('/bookings', {
        ...bookingData,
        roomId,
      })
      toast.success('Booking created! Proceeding to payment...')
      const bookingResult = data.data
      navigate(`/payment/${bookingResult._id || bookingResult.bookingId}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading booking form...</p>
        </div>
      </div>
    )
  }

  const totalCost = calculateTotal()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-max py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-red-500 font-semibold mb-8 hover:text-red-600"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h1 className="text-3xl font-bold mb-8">Confirm Your Booking</h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Guest Info */}
                <div>
                  <h3 className="text-lg font-bold mb-4">Guest Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-gray-600 text-sm">{user?.email}</p>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h3 className="text-lg font-bold mb-4">Your Stay</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Check In</label>
                      <input
                        type="date"
                        value={bookingData.checkInDate}
                        onChange={(e) =>
                          setBookingData({ ...bookingData, checkInDate: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Check Out</label>
                      <input
                        type="date"
                        value={bookingData.checkOutDate}
                        onChange={(e) =>
                          setBookingData({ ...bookingData, checkOutDate: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Number of Guests</label>
                  <input
                    type="number"
                    min="1"
                    max={room?.capacity}
                    value={bookingData.guestCount}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, guestCount: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>

                {/* Special Requests */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Special Requests</label>
                  <textarea
                    value={bookingData.specialRequests}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, specialRequests: e.target.value })
                    }
                    placeholder="Any special requests? (optional)"
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  ></textarea>
                </div>

                {/* Policies */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Lock size={18} />
                    Cancellation Policy
                  </h4>
                  <p className="text-sm text-gray-700">
                    Free cancellation up to 48 hours before check-in
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting || !bookingData.checkInDate || !bookingData.checkOutDate}
                  className="w-full btn-primary py-3 font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Booking'}
                </button>
              </form>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="card p-6 sticky top-20">
              <h3 className="font-bold text-lg mb-4">Booking Summary</h3>

              {room && (
                <div className="space-y-4 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-gray-600 text-sm">{room.roomType}</p>
                    <p className="font-semibold">${room.pricePerNight}/night</p>
                  </div>
                </div>
              )}

              <div className="space-y-3 py-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-semibold">
                    {bookingData.checkInDate ? new Date(bookingData.checkInDate).toLocaleDateString() : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-semibold">
                    {bookingData.checkOutDate ? new Date(bookingData.checkOutDate).toLocaleDateString() : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guests</span>
                  <span className="font-semibold">{bookingData.guestCount}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">${totalCost}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600">Service Fee (10%)</span>
                  <span className="font-semibold">${Math.round(totalCost * 0.1)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${totalCost + Math.round(totalCost * 0.1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
