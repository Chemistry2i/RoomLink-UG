import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Shield, Bell, Trash2, Save, Eye, EyeOff } from 'lucide-react'
import useAuthStore from '../store/authStore'
import useUserStore from '../store/userStore'
import api from '../config/api'
import toast from 'react-hot-toast'

export default function Profile() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const { profile, preferences, loading, fetchProfile, updateProfile, fetchPreferences, updatePreferences, deleteAccount } = useUserStore()

  const [tab, setTab] = useState('profile')
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [notifPrefs, setNotifPrefs] = useState({
    emailBooking: true,
    emailPayment: true,
    emailReview: true,
    emailComplaint: true,
  })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchProfile()
    fetchPreferences()
  }, [user, navigate, fetchProfile, fetchPreferences])

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      })
    }
  }, [profile])

  useEffect(() => {
    if (preferences) {
      setNotifPrefs(prev => ({ ...prev, ...preferences }))
    }
  }, [preferences])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const result = await updateProfile({ name: form.name, phone: form.phone })
    if (result) {
      setUser({ ...user, name: form.name, phone: form.phone })
    }
    setSaving(false)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setSaving(true)
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success('Password changed successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    }
    setSaving(false)
  }

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await updatePreferences(notifPrefs)
    setSaving(false)
  }

  const handleDeleteAccount = async () => {
    const success = await deleteAccount()
    if (success) {
      navigate('/')
      window.location.reload()
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-max py-8">
        <h1 className="text-3xl font-bold mb-6">My Account</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="w-full lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    tab === id
                      ? 'bg-red-50 text-red-600 border-l-3 border-red-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {tab === 'profile' && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">Personal Information</h2>
                <form onSubmit={handleProfileSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={form.email}
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                        placeholder="+256 7XX XXX XXX"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-sm text-gray-500">Role:</span>
                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-semibold capitalize">
                      {user?.role}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 btn-primary px-6 py-2.5 disabled:opacity-50"
                    >
                      <Save size={18} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {tab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-xl font-bold mb-6">Change Password</h2>
                  <form onSubmit={handlePasswordChange} className="space-y-5 max-w-md">
                    {['current', 'new', 'confirm'].map((field) => {
                      const key = `${field}Password`
                      const labels = { current: 'Current Password', new: 'New Password', confirm: 'Confirm New Password' }
                      return (
                        <div key={field}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{labels[field]}</label>
                          <div className="relative">
                            <input
                              type={showPasswords[field] ? 'text' : 'password'}
                              value={passwordForm[key]}
                              onChange={(e) => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                              className="w-full pr-10 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPasswords[field] ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 btn-primary px-6 py-2.5 disabled:opacity-50"
                    >
                      <Shield size={18} />
                      {saving ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
                  <h2 className="text-xl font-bold text-red-600 mb-2">Danger Zone</h2>
                  <p className="text-gray-600 text-sm mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 px-5 py-2.5 border border-red-500 text-red-500 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={18} />
                      Delete Account
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={loading}
                        className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        Yes, Delete My Account
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-5 py-2.5 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {tab === 'notifications' && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">Notification Preferences</h2>
                <form onSubmit={handlePreferencesSubmit} className="space-y-4 max-w-md">
                  {[
                    { key: 'emailBooking', label: 'Booking confirmations & updates' },
                    { key: 'emailPayment', label: 'Payment receipts & refund notices' },
                    { key: 'emailReview', label: 'Review invitations' },
                    { key: 'emailComplaint', label: 'Complaint status updates' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <span className="text-sm text-gray-700">{label}</span>
                      <input
                        type="checkbox"
                        checked={notifPrefs[key]}
                        onChange={() => setNotifPrefs({ ...notifPrefs, [key]: !notifPrefs[key] })}
                        className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500"
                      />
                    </label>
                  ))}
                  <div className="pt-4 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 btn-primary px-6 py-2.5 disabled:opacity-50"
                    >
                      <Save size={18} />
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
