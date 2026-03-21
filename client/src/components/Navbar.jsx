import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Heart, MessageCircle, User } from 'lucide-react'
import useAuthStore from '../store/authStore'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container-max">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold">RL</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline">RoomLink</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-gray-900 font-medium">
              Explore
            </Link>
            <Link to="/register" className="text-gray-700 hover:text-gray-900 font-medium">
              Become a Host
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="hidden sm:flex items-center space-x-4">
                <Heart size={20} className="cursor-pointer text-gray-700 hover:text-red-500" />
                <MessageCircle size={20} className="cursor-pointer text-gray-700" />
                <div className="relative group">
                  <button className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={18} />
                  </button>
                  <div className="hidden group-hover:flex flex-col absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                    <Link to={user?.role === 'host' ? '/host/dashboard' : user?.role === 'admin' || user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} className="px-4 py-2 hover:bg-gray-50 text-sm">
                      Dashboard
                    </Link>
                    <Link to="/profile" className="px-4 py-2 hover:bg-gray-50 text-sm">
                      My Profile
                    </Link>
                    <Link to="/complaints" className="px-4 py-2 hover:bg-gray-50 text-sm">
                      Complaints
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 hover:bg-gray-50 text-sm text-left text-red-500"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-gray-900 font-medium">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-gray-700"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t">
            <Link to="/" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
              Explore
            </Link>
            <Link to="/register" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
              Become a Host
            </Link>
            {!user ? (
              <>
                <Link to="/login" className="block px-4 py-2 text-gray-700">
                  Login
                </Link>
                <Link to="/register" className="block px-4 py-2 text-red-500 font-semibold">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                <Link to={user?.role === 'host' ? '/host/dashboard' : user?.role === 'admin' || user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                  Dashboard
                </Link>
                <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                  My Profile
                </Link>
                <Link to="/complaints" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                  Complaints
                </Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-50">
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
