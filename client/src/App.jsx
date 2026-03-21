import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { lazy, Suspense } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import PrivateRoute from './components/PrivateRoute'

// Spinner for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
  </div>
)

// Wrap lazy components so each route has its own Suspense boundary
function Lazy({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

// Public pages (eagerly loaded for fast first paint)
import Home from './pages/Home'
import Search from './pages/Search'
import HostelDetail from './pages/HostelDetail'
import NotFound from './pages/NotFound'

// Auth pages (lazy)
const Login = lazy(() => import('./pages/Auth/Login'))
const Register = lazy(() => import('./pages/Auth/Register'))
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'))
const VerifyEmail = lazy(() => import('./pages/Auth/VerifyEmail'))
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'))

// User pages (lazy)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const Booking = lazy(() => import('./pages/Booking'))
const Payment = lazy(() => import('./pages/Payment'))
const Complaints = lazy(() => import('./pages/Complaints'))

// Host pages (lazy)
const HostDashboard = lazy(() => import('./pages/HostDashboard'))
const HostHostels = lazy(() => import('./pages/Host/HostHostels'))
const AddHostel = lazy(() => import('./pages/Host/AddHostel'))
const EditHostel = lazy(() => import('./pages/Host/EditHostel'))
const ManageRooms = lazy(() => import('./pages/Host/ManageRooms'))
const HostBookings = lazy(() => import('./pages/Host/HostBookings'))
const HostReviews = lazy(() => import('./pages/Host/HostReviews'))

// Admin pages (lazy)
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/Admin/AdminUsers'))
const AdminHostels = lazy(() => import('./pages/Admin/AdminHostels'))
const AdminBookings = lazy(() => import('./pages/Admin/AdminBookings'))
const AdminComplaints = lazy(() => import('./pages/Admin/AdminComplaints'))
const AdminReports = lazy(() => import('./pages/Admin/AdminReports'))

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/hostel/:id" element={<HostelDetail />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Lazy><Login /></Lazy>} />
            <Route path="/register" element={<Lazy><Register /></Lazy>} />
            <Route path="/forgot-password" element={<Lazy><ForgotPassword /></Lazy>} />
            <Route path="/verify-email" element={<Lazy><VerifyEmail /></Lazy>} />
            <Route path="/reset-password" element={<Lazy><ResetPassword /></Lazy>} />

            {/* Authenticated User Routes */}
            <Route path="/dashboard" element={<PrivateRoute><Lazy><Dashboard /></Lazy></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Lazy><Profile /></Lazy></PrivateRoute>} />
            <Route path="/booking/:roomId" element={<PrivateRoute><Lazy><Booking /></Lazy></PrivateRoute>} />
            <Route path="/payment/:bookingId" element={<PrivateRoute><Lazy><Payment /></Lazy></PrivateRoute>} />
            <Route path="/complaints" element={<PrivateRoute><Lazy><Complaints /></Lazy></PrivateRoute>} />

            {/* Host Routes */}
            <Route path="/host/dashboard" element={<PrivateRoute roles={['host']}><Lazy><HostDashboard /></Lazy></PrivateRoute>} />
            <Route path="/host/hostels" element={<PrivateRoute roles={['host']}><Lazy><HostHostels /></Lazy></PrivateRoute>} />
            <Route path="/host/add-hostel" element={<PrivateRoute roles={['host']}><Lazy><AddHostel /></Lazy></PrivateRoute>} />
            <Route path="/host/hostels/:id/edit" element={<PrivateRoute roles={['host']}><Lazy><EditHostel /></Lazy></PrivateRoute>} />
            <Route path="/host/hostels/:hostelId/rooms" element={<PrivateRoute roles={['host']}><Lazy><ManageRooms /></Lazy></PrivateRoute>} />
            <Route path="/host/bookings" element={<PrivateRoute roles={['host']}><Lazy><HostBookings /></Lazy></PrivateRoute>} />
            <Route path="/host/reviews" element={<PrivateRoute roles={['host']}><Lazy><HostReviews /></Lazy></PrivateRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<PrivateRoute roles={['admin', 'ADMIN', 'SUPER_ADMIN']}><Lazy><AdminDashboard /></Lazy></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute roles={['admin', 'ADMIN', 'SUPER_ADMIN']}><Lazy><AdminUsers /></Lazy></PrivateRoute>} />
            <Route path="/admin/hostels" element={<PrivateRoute roles={['admin', 'ADMIN', 'SUPER_ADMIN']}><Lazy><AdminHostels /></Lazy></PrivateRoute>} />
            <Route path="/admin/bookings" element={<PrivateRoute roles={['admin', 'ADMIN', 'SUPER_ADMIN']}><Lazy><AdminBookings /></Lazy></PrivateRoute>} />
            <Route path="/admin/complaints" element={<PrivateRoute roles={['admin', 'ADMIN', 'SUPER_ADMIN', 'staff', 'STAFF']}><Lazy><AdminComplaints /></Lazy></PrivateRoute>} />
            <Route path="/admin/reports" element={<PrivateRoute roles={['admin', 'ADMIN', 'SUPER_ADMIN']}><Lazy><AdminReports /></Lazy></PrivateRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App
