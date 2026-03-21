import { useEffect, useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Building2, CalendarDays, DollarSign, AlertTriangle,
  BarChart3, Shield, FileText,
  ShieldCheck,
} from 'lucide-react'
import { DashboardLayout, StatsCard, WelcomeBanner } from '../../components/dashboard'
import useAuthStore from '../../store/authStore'
import api from '../../config/api'
import toast from 'react-hot-toast'
import { adminSidebarItems } from '../../config/sidebarItems'

// Lazy-load individual charts (Recharts is large)
const RevenueChart = lazy(() => import('../../components/dashboard/Charts').then(m => ({ default: m.RevenueChart })))
const BookingsChart = lazy(() => import('../../components/dashboard/Charts').then(m => ({ default: m.BookingsChart })))
const StatusPieChart = lazy(() => import('../../components/dashboard/Charts').then(m => ({ default: m.StatusPieChart })))

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }

    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard/admin')
        setDashboard(data.data)
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load admin dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [user, navigate])

  if (loading) {
    return (
      <DashboardLayout sidebarItems={adminSidebarItems} sidebarHeader="Admin Panel">
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  const stats = dashboard || {}

  return (
    <DashboardLayout sidebarItems={adminSidebarItems} sidebarHeader="Admin Panel">
      <WelcomeBanner
        userName={user?.name}
        icon={ShieldCheck}
        subtitle="Platform overview and system health."
        action={{ label: 'View Reports', to: '/admin/reports' }}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Users"
          value={stats.users?.total || 0}
          icon={Users}
          color="blue"
          trend={stats.users?.growth}
          trendLabel="vs last month"
        />
        <StatsCard
          title="Total Hostels"
          value={stats.hostels?.total || 0}
          icon={Building2}
          color="purple"
        />
        <StatsCard
          title="Total Bookings"
          value={stats.bookings?.total || 0}
          icon={CalendarDays}
          color="green"
          trend={stats.bookings?.growth}
          trendLabel="vs last month"
        />
        <StatsCard
          title="Revenue"
          value={stats.revenue?.total || 0}
          icon={DollarSign}
          color="yellow"
          prefix="$"
          trend={stats.revenue?.growth}
          trendLabel="vs last month"
        />
      </div>

      {/* Charts Row */}
      <Suspense fallback={
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-64 animate-pulse" />
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-64 animate-pulse" />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-64 animate-pulse" />
        </div>
      }>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-base font-bold text-gray-900 mb-4">Revenue Trend</h3>
            <RevenueChart data={stats.revenueChart || []} />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-base font-bold text-gray-900 mb-4">Booking Trend</h3>
            <BookingsChart data={stats.bookingsChart || []} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-base font-bold text-gray-900 mb-4">Booking Status</h3>
            <StatusPieChart data={stats.bookings?.byStatus || []} />
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
            <h3 className="text-base font-bold text-gray-900 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Open Complaints</p>
                <p className="text-2xl font-bold text-red-600">{stats.complaints?.open || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Pending Bookings</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.bookings?.pending || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Active Hosts</p>
                <p className="text-2xl font-bold text-blue-600">{stats.users?.hosts || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Avg. Rating</p>
                <p className="text-2xl font-bold text-green-600">{stats.reviews?.avgRating?.toFixed(1) || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </DashboardLayout>
  )
}
