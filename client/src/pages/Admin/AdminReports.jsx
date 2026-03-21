import { useEffect, useState } from 'react'
import {
  BarChart3, Download,
} from 'lucide-react'
import { DashboardLayout } from '../../components/dashboard'
import api from '../../config/api'
import toast from 'react-hot-toast'
import { adminSidebarItems } from '../../config/sidebarItems'

const REPORT_TYPES = [
  { id: 'booking', label: 'Booking Reports', description: 'Monthly bookings, cancellations, revenue' },
  { id: 'complaint', label: 'Complaint Reports', description: 'Resolution times, categories, trends' },
  { id: 'user', label: 'User Reports', description: 'Growth, top customers, repeat rate' },
  { id: 'revenue', label: 'Revenue Reports', description: 'Breakdown by hostel, period performance' },
]

export default function AdminReports() {
  const [activeReport, setActiveReport] = useState('booking')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('month')

  const fetchReport = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/reports/${activeReport}?period=${period}`)
      setReport(data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report')
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [activeReport, period])

  return (
    <DashboardLayout sidebarItems={adminSidebarItems} sidebarHeader="Admin Panel">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and view platform reports</p>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {REPORT_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveReport(type.id)}
            className={`text-left p-4 rounded-xl border transition-colors ${
              activeReport === type.id
                ? 'bg-red-50 border-red-300 text-red-700'
                : 'bg-white border-gray-100 hover:bg-gray-50'
            }`}
          >
            <p className="font-semibold text-sm">{type.label}</p>
            <p className="text-xs text-gray-500 mt-1">{type.description}</p>
          </button>
        ))}
      </div>

      {/* Period & Generate */}
      <div className="flex items-center gap-3 mb-6">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="flex items-center gap-2 btn-primary px-5 py-2.5 disabled:opacity-50"
        >
          <BarChart3 size={16} />
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : report ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {REPORT_TYPES.find((t) => t.id === activeReport)?.label}
              </h3>
            </div>
            {/* Render report data as key-value pairs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(report).map(([key, value]) => (
                <div key={key} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {typeof value === 'number' ? value.toLocaleString() : typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <BarChart3 size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No report data available</p>
            <p className="text-sm text-gray-400 mt-1">Select a report type and period</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
