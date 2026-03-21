import { useEffect, useState } from 'react'
import {
  AlertTriangle, MessageSquare, Clock, CheckCircle, XCircle,
  ArrowUpRight, StickyNote,
} from 'lucide-react'
import { DashboardLayout, DataTable, Modal } from '../../components/dashboard'
import useComplaintStore from '../../store/complaintStore'
import { adminSidebarItems } from '../../config/sidebarItems'

const STATUS_STYLES = {
  open: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'in-progress': { bg: 'bg-blue-100', text: 'text-blue-700' },
  resolved: { bg: 'bg-green-100', text: 'text-green-700' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-700' },
}

export default function AdminComplaints() {
  const {
    complaints, loading, fetchComplaints, fetchComplaint, selectedComplaint,
    updateStatus, resolveComplaint, escalateComplaint, addNote,
  } = useComplaintStore()

  const [statusFilter, setStatusFilter] = useState('')
  const [detailModal, setDetailModal] = useState(false)
  const [actionModal, setActionModal] = useState({ open: false, type: '', id: '' })
  const [actionText, setActionText] = useState('')

  useEffect(() => {
    fetchComplaints(1, statusFilter)
  }, [fetchComplaints, statusFilter])

  const openDetail = async (complaint) => {
    await fetchComplaint(complaint._id)
    setDetailModal(true)
  }

  const handleAction = async () => {
    const { type, id } = actionModal
    let result
    if (type === 'resolve') result = await resolveComplaint(id, actionText)
    else if (type === 'escalate') result = await escalateComplaint(id, actionText)
    else if (type === 'note') result = await addNote(id, actionText)
    else if (type === 'status') result = await updateStatus(id, actionText)

    if (result) {
      setActionModal({ open: false, type: '', id: '' })
      setActionText('')
      fetchComplaints(1, statusFilter)
    }
  }

  const columns = [
    {
      key: 'title',
      label: 'Complaint',
      sortable: true,
      accessor: 'title',
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900 truncate max-w-xs">{row.title}</p>
          <p className="text-xs text-gray-500">{row.category}</p>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'Submitted By',
      accessor: (row) => row.user?.name || '—',
    },
    {
      key: 'priority',
      label: 'Priority',
      accessor: 'priority',
      render: (row) => {
        const colors = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700' }
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${colors[row.priority] || colors.medium}`}>
            {row.priority || 'medium'}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      accessor: 'status',
      render: (row) => {
        const style = STATUS_STYLES[row.status] || STATUS_STYLES.open
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
            {row.status}
          </span>
        )
      },
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      accessor: 'createdAt',
      render: (row) => <span className="text-sm text-gray-500">{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openDetail(row)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
            <MessageSquare size={16} />
          </button>
          {row.status !== 'resolved' && row.status !== 'closed' && (
            <>
              <button onClick={() => { setActionModal({ open: true, type: 'resolve', id: row._id }); setActionText('') }} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Resolve">
                <CheckCircle size={16} />
              </button>
              <button onClick={() => { setActionModal({ open: true, type: 'escalate', id: row._id }); setActionText('') }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Escalate">
                <ArrowUpRight size={16} />
              </button>
            </>
          )}
          <button onClick={() => { setActionModal({ open: true, type: 'note', id: row._id }); setActionText('') }} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Add Note">
            <StickyNote size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout sidebarItems={adminSidebarItems} sidebarHeader="Admin Panel">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Complaints Management</h1>
        <p className="text-sm text-gray-500 mt-1">Review and resolve user complaints</p>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
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

      <DataTable
        columns={columns}
        data={complaints}
        searchable
        searchPlaceholder="Search complaints..."
        emptyIcon={AlertTriangle}
        emptyTitle="No complaints"
        emptyDescription="All clear — no complaints to show."
      />

      {/* Detail Modal */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title="Complaint Details" size="lg">
        {selectedComplaint && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${(STATUS_STYLES[selectedComplaint.status] || STATUS_STYLES.open).bg} ${(STATUS_STYLES[selectedComplaint.status] || STATUS_STYLES.open).text}`}>
                {selectedComplaint.status}
              </span>
              <span className="text-sm text-gray-500">{selectedComplaint.category}</span>
              <span className="text-sm text-gray-400">{new Date(selectedComplaint.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <h3 className="font-bold text-lg">{selectedComplaint.title}</h3>
              <p className="text-sm text-gray-500 mt-1">By: {selectedComplaint.user?.name || '—'}</p>
              <p className="text-gray-600 mt-3 leading-relaxed">{selectedComplaint.description}</p>
            </div>
            {selectedComplaint.resolution && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-700 mb-1">Resolution</p>
                <p className="text-sm text-green-800">{selectedComplaint.resolution}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        isOpen={actionModal.open}
        onClose={() => { setActionModal({ open: false, type: '', id: '' }); setActionText('') }}
        title={
          actionModal.type === 'resolve' ? 'Resolve Complaint' :
          actionModal.type === 'escalate' ? 'Escalate Complaint' :
          actionModal.type === 'note' ? 'Add Internal Note' :
          'Update Status'
        }
        size="sm"
        footer={
          <>
            <button onClick={() => { setActionModal({ open: false, type: '', id: '' }); setActionText('') }} className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleAction} disabled={!actionText.trim()} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
              Submit
            </button>
          </>
        }
      >
        <textarea
          value={actionText}
          onChange={(e) => setActionText(e.target.value)}
          rows={4}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
          placeholder={
            actionModal.type === 'resolve' ? 'Resolution details...' :
            actionModal.type === 'escalate' ? 'Reason for escalation...' :
            'Add a note...'
          }
        />
      </Modal>
    </DashboardLayout>
  )
}
