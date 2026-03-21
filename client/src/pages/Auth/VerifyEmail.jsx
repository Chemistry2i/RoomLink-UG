import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import api from '../../config/api'
import toast from 'react-hot-toast'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      toast.error('Invalid verification link')
      navigate('/login')
    } else {
      setToken(tokenParam)
      // Auto-verify on mount if token is present
      verifyEmailToken(tokenParam)
    }
  }, [searchParams, navigate])

  const verifyEmailToken = async (verificationToken) => {
    setLoading(true)
    try {
      await api.post('/auth/verify-email', { token: verificationToken })
      setVerified(true)
      toast.success('Email verified successfully!')
      setTimeout(() => navigate('/login'), 2000)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    await verifyEmailToken(token)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={32} className="text-red-500" />
          </div>
          <h2 className="text-3xl font-bold">Verify Your Email</h2>
          <p className="text-gray-600 mt-2">Verifying your email address...</p>
        </div>

        {!verified ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin" />
            <p className="text-gray-600 mt-6">
              {loading ? 'Verifying email...' : 'Please wait while we verify your email.'}
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-2xl text-green-600"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">Email Verified!</h3>
            <p className="text-gray-600">Your email has been verified successfully. Redirecting to login...</p>
          </div>
        )}

        {!verified && (
          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-red-500 font-semibold hover:text-red-600">
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
