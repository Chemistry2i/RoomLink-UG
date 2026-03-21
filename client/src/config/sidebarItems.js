import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Star,
  Settings,
  Users,
  AlertTriangle,
  BarChart3,
  MessageSquare,
  Search,
  User,
} from 'lucide-react'

export const userSidebarItems = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { divider: true, label: 'Activity' },
  { path: '/search', label: 'Find Hostels', icon: Search },
  { path: '/complaints', label: 'Complaints', icon: MessageSquare },
  { divider: true, label: 'Account' },
  { path: '/profile', label: 'Profile', icon: User },
]

export const hostSidebarItems = [
  { path: '/host/dashboard', label: 'Overview', icon: LayoutDashboard },
  { divider: true, label: 'Management' },
  { path: '/host/hostels', label: 'My Hostels', icon: Building2 },
  { path: '/host/bookings', label: 'Bookings', icon: CalendarDays },
  { path: '/host/reviews', label: 'Reviews', icon: Star },
  { path: '/complaints', label: 'Complaints', icon: MessageSquare },
  { divider: true, label: 'Account' },
  { path: '/profile', label: 'Settings', icon: Settings },
]

export const adminSidebarItems = [
  { path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { divider: true, label: 'Management' },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/hostels', label: 'Hostels', icon: Building2 },
  { path: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { path: '/admin/complaints', label: 'Complaints', icon: AlertTriangle },
  { divider: true, label: 'Reports' },
  { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { divider: true, label: 'System' },
  { path: '/profile', label: 'Settings', icon: Settings },
]
