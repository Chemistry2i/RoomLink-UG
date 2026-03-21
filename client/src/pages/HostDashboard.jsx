import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Building2, DollarSign, Star, Users, AlertCircle, TrendingUp, Plus, Hotel, CalendarDays, MessageSquare } from 'lucide-react'
import useAuthStore from '../store/authStore'
import api from '../config/api'
import toast from 'react-hot-toast'
import { DashboardLayout, StatsCard, WelcomeBanner, ActivityFeed } from '../components/dashboard'
import { hostSidebarItems } from '../config/sidebarItems'

export default function HostDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (user.role !== 'host') {
      navigate('/dashboard')
      return
    }

    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard/host')
        setDashboard(data.data)
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [user, navigate])

  if (loading) {
    return (
      <DashboardLayout sidebarItems={hostSidebarItems} sidebarHeader="Host Panel">
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    )
  }

  const stats = dashboard || {}
  const totalRevenue = stats.revenue?.total || 0
  const totalBookings = stats.bookings?.total || 0
  const totalHostels = stats.hostels || 0
  const openComplaints = stats.complaints?.open || 0
  const avgRating = stats.reviews?.avgRating || 0
  const totalReviews = stats.reviews?.total || 0

  const bookingsByStatus = (stats.bookings?.byStatus || []).reduce((acc, item) => {
    acc[item._id] = item.count
    return acc
  }, {})

  // Build recent activity from dashboard data
  const recentActivity = (stats.recentBookings || stats.recentActivity || []).map((item) => ({
    _id: item._id,
    type: item.type || 'booking',
    icon: item.type === 'review' ? MessageSquare : CalendarDays,
    user: item.user?.name || item.userName || '',
    message: item.message || `${item.status || 'new'} booking`,
    detail: item.hostel?.name || item.hostelName || '',
    time: item.createdAt || item.date,
  }))

  return (
    <DashboardLayout sidebarItems={hostSidebarItems} sidebarHeader="Host Panel">
      <WelcomeBanner
        userName={user?.name}
        icon={Hotel}
        subtitle="Track your properties, bookings, and revenue."
        action={{ label: 'Add New Hostel', to: '/host/add-hostel' }}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="My Hostels" value={totalHostels} icon={Building2} color="blue" />
        <StatsCard title="Total Revenue" value={totalRevenue} icon={DollarSign} color="green" prefix="$" />
        <StatsCard title="Total Bookings" value={totalBookings} icon={Users} color="purple" />
        <StatsCard title="Avg Rating" value={`${avgRating} (${totalReviews})`} icon={Star} color="yellow" />
      </div>

        {/* Booking Status + Complaints */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Booking Status Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={22} />
              Booking Status
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Confirmed', key: 'confirmed', color: 'bg-green-500' },
                { label: 'Pending', key: 'pending', color: 'bg-yellow-500' },
                { label: 'Checked In', key: 'checked_in', color: 'bg-blue-500' },
                { label: 'Completed', key: 'completed', color: 'bg-gray-500' },
                { label: 'Cancelled', key: 'cancelled', color: 'bg-red-500' },
              ].map(({ label, key, color }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                    <span className="text-gray-700">{label}</span>
                  </div>
                  <span className="font-semibold">{bookingsByStatus[key] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & Complaints */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle size={22} />
              Alerts & Quick Actions
            </h2>

            {openComplaints > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 font-semibold">
                  {openComplaints} open complaint{openComplaints > 1 ? 's' : ''} need attention
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Link
                to="/host/hostels"
                className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Manage My Hostels
              </Link>
              <Link
                to="/host/bookings"
                className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                View All Bookings
              </Link>
              <Link
                to="/host/reviews"
                className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Guest Reviews
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <ActivityFeed
            activities={recentActivity}
            title="Recent Activity"
            maxItems={6}
          />
        </div>

        {/* No Hostels CTA */}
        {totalHostels === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
            <Building2 size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">No Hostels Yet</h3>
            <p className="text-gray-600 mb-6">Start by adding your first property to begin receiving bookings.</p>
            <Link to="/host/add-hostel" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
              <Plus size={18} />
              Add Your First Hostel
            </Link>
          </div>
        )}
    </DashboardLayout>
  )
}
