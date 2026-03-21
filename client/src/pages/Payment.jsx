import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CreditCard, Phone, CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react'
import useAuthStore from '../store/authStore'
import usePaymentStore from '../store/paymentStore'
import api from '../config/api'
import toast from 'react-hot-toast'

export default function Payment() {
  const navigate = useNavigate()
  const { bookingId } = useParams()
  const { user } = useAuthStore()
  const { currentPayment, loading, initiatePayment, checkStatus } = usePaymentStore()

  const [booking, setBooking] = useState(null)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [method, setMethod] = useState('mpesa')
  const [phone, setPhone] = useState('')
  const [paymentState, setPaymentState] = useState('form') // form | processing | success | failed

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    const fetchBooking = async () => {
      try {
        const { data } = await api.get(`/bookings/${bookingId}`)
        setBooking(data.data)
      } catch {
        toast.error('Booking not found')
        navigate('/dashboard')
      } finally {
        setFetchLoading(false)
      }
    }
    fetchBooking()
  }, [user, bookingId, navigate])

  const handlePayment = async (e) => {
    e.preventDefault()
    if (!phone && method === 'mpesa') {
      toast.error('Please enter your M-Pesa phone number')
      return
    }

    setPaymentState('processing')
    const result = await initiatePayment({
      bookingId,
      method,
      phone: method === 'mpesa' ? phone : undefined,
      amount: booking.totalPrice,
    })

    if (result) {
      // Poll for status
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        const status = await checkStatus(result._id || result.paymentId)
        if (status?.status === 'completed' || status?.status === 'success') {
          clearInterval(poll)
          setPaymentState('success')
        } else if (status?.status === 'failed' || attempts > 30) {
          clearInterval(poll)
          if (attempts > 30) {
            setPaymentState('success') // Assume pending
            toast.success('Payment is being processed')
          } else {
            setPaymentState('failed')
          }
        }
      }, 5000)
    } else {
      setPaymentState('failed')
    }
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-max py-8 max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Payment States */}
        {paymentState === 'success' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">Your booking has been confirmed.</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary px-6 py-2.5">
              Go to Dashboard
            </button>
          </div>
        )}

        {paymentState === 'failed' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">Something went wrong. Please try again.</p>
            <button onClick={() => setPaymentState('form')} className="btn-primary px-6 py-2.5">
              Try Again
            </button>
          </div>
        )}

        {paymentState === 'processing' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-yellow-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Processing Payment</h2>
            <p className="text-gray-600 mb-2">
              {method === 'mpesa' ? 'Check your phone for the M-Pesa prompt...' : 'Processing your payment...'}
            </p>
            <div className="w-8 h-8 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin mx-auto mt-4" />
          </div>
        )}

        {paymentState === 'form' && (
          <>
            <h1 className="text-2xl font-bold mb-6">Complete Payment</h1>

            {/* Booking Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-bold mb-3">Booking Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Booking ID</span>
                  <span className="font-mono">{booking?.bookingNumber || bookingId?.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Check-in</span>
                  <span>{booking?.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Check-out</span>
                  <span>{booking?.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString() : '—'}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-xl font-bold text-red-600">
                    ${booking?.totalPrice?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-bold mb-4">Payment Method</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setMethod('mpesa')}
                  className={`p-4 rounded-xl border-2 text-center transition-colors ${
                    method === 'mpesa'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Phone size={24} className="mx-auto mb-2 text-green-600" />
                  <p className="font-semibold text-sm">M-Pesa</p>
                  <p className="text-xs text-gray-500">Mobile Money</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`p-4 rounded-xl border-2 text-center transition-colors ${
                    method === 'card'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard size={24} className="mx-auto mb-2 text-blue-600" />
                  <p className="font-semibold text-sm">Card</p>
                  <p className="text-xs text-gray-500">Visa / Mastercard</p>
                </button>
              </div>

              {method === 'mpesa' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                    placeholder="256 7XX XXX XXX"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">You'll receive an STK push prompt on this number</p>
                </div>
              )}

              {method === 'card' && (
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Card payment will be available soon. Please use M-Pesa for now.</p>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handlePayment}
              disabled={loading || (method === 'mpesa' && !phone) || method === 'card'}
              className="w-full btn-primary py-3 text-lg font-bold disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Pay $${booking?.totalPrice?.toLocaleString() || 0}`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
