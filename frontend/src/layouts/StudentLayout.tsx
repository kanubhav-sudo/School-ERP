import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  User, 
  CalendarCheck, 
  Clock, 
  CreditCard, 
  FileText, 
  BookOpen, 
  Bell, 
  Megaphone 
} from 'lucide-react'

const navItems = [
  { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/student/profile', label: 'My Profile', icon: User },
  { path: '/student/attendance', label: 'Attendance', icon: CalendarCheck },
  { path: '/student/timetable', label: 'Timetable', icon: Clock },
  { path: '/student/fees', label: 'Fee Summary', icon: CreditCard },
  { path: '/student/exams', label: 'Exams & Results', icon: FileText },
  { path: '/student/homework', label: 'Homework', icon: BookOpen },
  { path: '/student/notices', label: 'Noticeboard', icon: Bell },
  { path: '/student/announcements', label: 'Announcements', icon: Megaphone },
]

export function StudentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const currentPathLabel = navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'

  return (
    <div className="min-h-screen flex bg-muted/40">
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="h-16 border-b flex items-center px-6 font-bold text-lg text-primary">
          Student Portal
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
          <div className="font-medium">
            <span className="text-muted-foreground">Pages / </span> {currentPathLabel}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <p className="font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
