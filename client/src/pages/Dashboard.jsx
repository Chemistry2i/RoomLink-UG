import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Bookmark, MapPin, Calendar, HomeIcon } from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../config/api'
import toast from 'react-hot-toast'
import { DashboardLayout, StatsCard, WelcomeBanner } from '../components/dashboard'
import { userSidebarItems } from '../config/sidebarItems'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchBookings = async () => {
      try {
        const { data } = await api.get('/bookings')
        setBookings(data.data?.bookings || data.data || [])
      } catch (error) {
        console.log('Could not load bookings')
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [user, navigate])

  const activeBookings = bookings.filter((b) => b.status === 'confirmed').length
  const totalSpent = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)

  return (
    <DashboardLayout sidebarItems={userSidebarItems} sidebarHeader="My Account">
      <WelcomeBanner
        userName={user?.name}
        icon={HomeIcon}
        subtitle="Here's a snapshot of your bookings and activity."
        action={{ label: 'Find Hostels', to: '/search' }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard title="Total Bookings" value={bookings.length} icon={Bookmark} color="blue" />
        <StatsCard title="Active Bookings" value={activeBookings} icon={Calendar} color="green" />
        <StatsCard title="Total Spent" value={totalSpent} icon={MapPin} color="purple" prefix="$" />
      </div>

      {/* Bookings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Bookmark size={22} />
          My Bookings
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div>
                    <p className="text-gray-500 text-xs font-semibold mb-1">Booking ID</p>
                    <p className="font-mono text-sm">{booking.bookingNumber || booking._id?.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-semibold mb-1 flex items-center gap-1">
                      <Calendar size={14} />
                      Duration
                    </p>
                    <p className="text-sm">
                      {new Date(booking.checkInDate).toLocaleDateString()} –{' '}
                      {new Date(booking.checkOutDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-semibold mb-1">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : booking.status === 'completed'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-xs font-semibold mb-1">Total Cost</p>
                    <p className="text-xl font-bold text-red-500">
                      ${booking.totalPrice || 0}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No bookings yet</p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              Start Exploring
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
