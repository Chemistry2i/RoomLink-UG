import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, MessageSquare, Clock, CheckCircle, XCircle,
  ChevronRight, Plus, Send,
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import useComplaintStore from '../store/complaintStore'
import { DashboardLayout, Modal } from '../components/dashboard'
import { hostSidebarItems, adminSidebarItems, userSidebarItems } from '../config/sidebarItems'

const STATUS_STYLES = {
  open: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
  'in-progress': { bg: 'bg-blue-100', text: 'text-blue-700', icon: MessageSquare },
  resolved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  closed: { bg: 'bg-gray-100', text: 'text-gray-700', icon: XCircle },
}

const CATEGORIES = [
  'Maintenance', 'Noise', 'Cleanliness', 'Safety', 'Staff Behavior',
  'Billing', 'Amenities', 'Other',
]

export default function Complaints() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    complaints, loading, pagination,
    fetchComplaints, createComplaint, fetchComplaint, selectedComplaint,
  } = useComplaintStore()

  const [statusFilter, setStatusFilter] = useState('')
  const [createModal, setCreateModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', category: 'Maintenance', hostelId: '',
  })

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchComplaints(1, statusFilter)
  }, [user, navigate, fetchComplaints, statusFilter])

  const handleCreate = async (e) => {
    e.preventDefault()
    const result = await createComplaint(form)
    if (result) {
      setCreateModal(false)
      setForm({ title: '', description: '', category: 'Maintenance', hostelId: '' })
    }
  }

  const handleViewDetail = async (complaint) => {
    await fetchComplaint(complaint._id)
    setDetailModal(true)
  }

  const sidebarMap = { host: hostSidebarItems, admin: adminSidebarItems }
  const sidebarItems = sidebarMap[user?.role] || userSidebarItems
  const headerMap = { host: 'Host Panel', admin: 'Admin Panel' }
  const sidebarHeader = headerMap[user?.role] || 'My Account'

  return (
    <DashboardLayout sidebarItems={sidebarItems} sidebarHeader={sidebarHeader}>
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Complaints</h1>
            <p className="text-gray-500 mt-1">Submit and track your complaints</p>
          </div>
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 btn-primary px-5 py-2.5"
          >
            <Plus size={18} />
            New Complaint
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {['', 'open', 'in-progress', 'resolved', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                statusFilter === status
                  ? 'bg-red-50 border-red-300 text-red-600'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {status ? status.replace('-', ' ').replace(/^\w/, (c) => c.toUpperCase()) : 'All'}
            </button>
          ))}
        </div>

        {/* Complaints List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : complaints.length > 0 ? (
          <div className="space-y-3">
            {complaints.map((complaint) => {
              const style = STATUS_STYLES[complaint.status] || STATUS_STYLES.open
              const Icon = style.icon
              return (
                <button
                  key={complaint._id}
                  onClick={() => handleViewDetail(complaint)}
                  className="w-full bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md transition-shadow flex items-center gap-4"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                    <Icon size={20} className={style.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{complaint.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-400">{complaint.category}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text} flex-shrink-0`}>
                    {complaint.status}
                  </span>
                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                </button>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <AlertTriangle size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No complaints</p>
            <p className="text-sm text-gray-400 mt-1">
              {statusFilter ? `No ${statusFilter} complaints.` : 'You have no complaints on record.'}
            </p>
          </div>
        )}
      </div>

      {/* Create Complaint Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Submit a Complaint"
        size="md"
        footer={
          <>
            <button onClick={() => setCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={loading || !form.title || !form.description} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
              <Send size={16} />
              Submit
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
              placeholder="Brief summary of the issue"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
              placeholder="Describe the issue in detail..."
              required
            />
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModal}
        onClose={() => setDetailModal(false)}
        title="Complaint Details"
        size="lg"
      >
        {selectedComplaint && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                (STATUS_STYLES[selectedComplaint.status] || STATUS_STYLES.open).bg
              } ${(STATUS_STYLES[selectedComplaint.status] || STATUS_STYLES.open).text}`}>
                {selectedComplaint.status}
              </span>
              <span className="text-sm text-gray-400">{selectedComplaint.category}</span>
              <span className="text-sm text-gray-400">
                {new Date(selectedComplaint.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{selectedComplaint.title}</h3>
              <p className="text-gray-600 mt-2 leading-relaxed">{selectedComplaint.description}</p>
            </div>
            {selectedComplaint.resolution && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-700 mb-1">Resolution</p>
                <p className="text-sm text-green-800">{selectedComplaint.resolution}</p>
              </div>
            )}
            {selectedComplaint.notes?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Staff Notes</p>
                <div className="space-y-2">
                  {selectedComplaint.notes.map((note, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                      {note.content || note}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
