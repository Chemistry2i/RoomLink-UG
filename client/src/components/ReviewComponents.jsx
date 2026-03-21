import { useState } from 'react'
import { Star, Send } from 'lucide-react'
import useReviewStore from '../store/reviewStore'
import useAuthStore from '../store/authStore'

function StarInput({ rating, onRate }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onRate(star)}
          className="p-0.5"
        >
          <Star
            size={24}
            className={`transition-colors ${
              star <= (hover || rating)
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
      {rating > 0 && (
        <span className="text-sm text-gray-500 ml-2">
          {rating === 5 ? 'Excellent' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
        </span>
      )}
    </div>
  )
}

export function ReviewForm({ hostelId, bookingId, onSubmitted }) {
  const { user } = useAuthStore()
  const { createReview, loading } = useReviewStore()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  if (!user) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) return
    const result = await createReview({
      hostel: hostelId,
      booking: bookingId,
      rating,
      comment,
    })
    if (result) {
      setRating(0)
      setComment('')
      onSubmitted?.()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-base font-bold text-gray-900 mb-3">Write a Review</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
        <StarInput rating={rating} onRate={setRating} />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
          placeholder="Share your experience..."
        />
      </div>
      <button
        type="submit"
        disabled={loading || rating === 0}
        className="flex items-center gap-2 btn-primary px-5 py-2 disabled:opacity-50 text-sm"
      >
        <Send size={16} />
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}

export function ReviewList({ reviews = [] }) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <Star size={32} className="text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No reviews yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {review.user?.name || 'Guest'}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  className={star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                />
              ))}
            </div>
          </div>
          {review.comment && (
            <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  )
}
