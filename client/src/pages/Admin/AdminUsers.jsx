import { useEffect, useState } from 'react'
import { Users, Shield, Ban, CheckCircle } from 'lucide-react'
import { DashboardLayout, DataTable, Modal } from '../../components/dashboard'
import api from '../../config/api'
import toast from 'react-hot-toast'
import { adminSidebarItems } from '../../config/sidebarItems'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionModal, setActionModal] = useState({ open: false, user: null, action: '' })
  const [reason, setReason] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users?limit=100')
      setUsers(data.data?.users || data.data || [])
    } catch (err) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    const { user, action } = actionModal
    if (!user) return

    try {
      if (action === 'suspend') {
        await api.patch(`/users/${user._id}/suspend`, { reason })
        toast.success('User suspended')
      } else if (action === 'unsuspend') {
        await api.patch(`/users/${user._id}/unsuspend`)
        toast.success('User unsuspended')
      }
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} user`)
    }
    setActionModal({ open: false, user: null, action: '' })
    setReason('')
  }

  const columns = [
    {
      key: 'name',
      label: 'User',
      sortable: true,
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      accessor: 'role',
      render: (row) => {
        const roleColors = {
          admin: 'bg-red-100 text-red-700',
          host: 'bg-purple-100 text-purple-700',
          staff: 'bg-blue-100 text-blue-700',
          user: 'bg-gray-100 text-gray-700',
        }
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${roleColors[row.role] || roleColors.user}`}>
            {row.role}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      accessor: (row) => row.isSuspended ? 'suspended' : row.isVerified ? 'verified' : 'unverified',
      render: (row) => {
        if (row.isSuspended) {
          return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Suspended</span>
        }
        if (row.isVerified) {
          return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Verified</span>
        }
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Unverified</span>
      },
    },
    {
      key: 'joined',
      label: 'Joined',
      sortable: true,
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-sm text-gray-500">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.isSuspended ? (
            <button
              onClick={() => setActionModal({ open: true, user: row, action: 'unsuspend' })}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Unsuspend"
            >
              <CheckCircle size={16} />
            </button>
          ) : (
            <button
              onClick={() => setActionModal({ open: true, user: row, action: 'suspend' })}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Suspend"
            >
              <Ban size={16} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout sidebarItems={adminSidebarItems} sidebarHeader="Admin Panel">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage platform users</p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchable
        searchPlaceholder="Search users..."
        emptyIcon={Users}
        emptyTitle="No users found"
        emptyDescription="Users will appear here once they register."
      />

      {/* Action Modal */}
      <Modal
        isOpen={actionModal.open}
        onClose={() => { setActionModal({ open: false, user: null, action: '' }); setReason('') }}
        title={actionModal.action === 'suspend' ? 'Suspend User' : 'Unsuspend User'}
        size="sm"
        footer={
          <>
            <button
              onClick={() => { setActionModal({ open: false, user: null, action: '' }); setReason('') }}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAction}
              className={`px-4 py-2 text-white rounded-lg font-medium ${
                actionModal.action === 'suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {actionModal.action === 'suspend' ? 'Suspend' : 'Unsuspend'}
            </button>
          </>
        }
      >
        <p className="text-gray-600 mb-3">
          {actionModal.action === 'suspend'
            ? `Suspend ${actionModal.user?.name}? They won't be able to access their account.`
            : `Unsuspend ${actionModal.user?.name}? They'll regain access to their account.`}
        </p>
        {actionModal.action === 'suspend' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
              placeholder="Reason for suspension..."
            />
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
