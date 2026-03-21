import { useEffect, useState } from 'react'
import { Star, MessageSquare, Reply, Send } from 'lucide-react'
import { DashboardLayout } from '../../components/dashboard'
import useHostelStore from '../../store/hostelStore'
import { hostSidebarItems } from '../../config/sidebarItems'
import api from '../../config/api'
import toast from 'react-hot-toast'

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
        />
      ))}
    </div>
  )
}

export default function HostReviews() {
  const { hostels, reviews, loading, fetchMyHostels, fetchHostelReviews } = useHostelStore()
  const [selectedHostel, setSelectedHostel] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  useEffect(() => {
    fetchMyHostels()
  }, [fetchMyHostels])

  useEffect(() => {
    if (selectedHostel) {
      fetchHostelReviews(selectedHostel)
    }
  }, [selectedHostel, fetchHostelReviews])

  useEffect(() => {
    if (hostels.length > 0 && !selectedHostel) {
      setSelectedHostel(hostels[0]._id)
    }
  }, [hostels, selectedHostel])

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return
    setReplyLoading(true)
    try {
      await api.post(`/reviews/${reviewId}/reply`, { text: replyText.trim() })
      toast.success('Reply sent!')
      setReplyingTo(null)
      setReplyText('')
      // Refresh reviews
      if (selectedHostel) fetchHostelReviews(selectedHostel)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply')
    } finally {
      setReplyLoading(false)
    }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '—'

  const respondedCount = reviews.filter((r) => r.ownerResponse?.text).length
  const responseRate = reviews.length ? Math.round((respondedCount / reviews.length) * 100) : 0

  return (
    <DashboardLayout sidebarItems={hostSidebarItems} sidebarHeader="Host Panel">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Guest Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">See what guests are saying about your hostels</p>
      </div>

      {/* Hostel Selector */}
      {hostels.length > 1 && (
        <div className="mb-6">
          <select
            value={selectedHostel}
            onChange={(e) => setSelectedHostel(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
          >
            {hostels.map((h) => (
              <option key={h._id} value={h._id}>{h.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Average Rating</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold">{avgRating}</span>
            <Star size={24} className="text-yellow-500 fill-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Total Reviews</p>
          <span className="text-3xl font-bold">{reviews.length}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">5-Star Reviews</p>
          <span className="text-3xl font-bold">{reviews.filter((r) => r.rating === 5).length}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Response Rate</p>
          <span className="text-3xl font-bold">{responseRate}%</span>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {review.user?.name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>
                <StarRating rating={review.rating} />
              </div>
              {review.comment && (
                <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
              )}

              {/* Owner Response */}
              {review.ownerResponse?.text ? (
                <div className="mt-3 pl-4 border-l-2 border-red-200 bg-red-50/50 rounded-r-lg p-3">
                  <p className="text-xs font-semibold text-red-600 mb-1">Your Reply</p>
                  <p className="text-sm text-gray-700">{review.ownerResponse.text}</p>
                  {review.ownerResponse.respondedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(review.ownerResponse.respondedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : replyingTo === review._id ? (
                <div className="mt-3 flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    rows={2}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
                    maxLength={500}
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleReply(review._id)}
                      disabled={replyLoading || !replyText.trim()}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      title="Send reply"
                    >
                      <Send size={16} />
                    </button>
                    <button
                      onClick={() => { setReplyingTo(null); setReplyText('') }}
                      className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setReplyingTo(review._id); setReplyText('') }}
                  className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Reply size={14} />
                  Reply
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <MessageSquare size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No reviews yet</p>
          <p className="text-sm text-gray-400 mt-1">Reviews will appear here after guests check out</p>
        </div>
      )}
    </DashboardLayout>
  )
}
