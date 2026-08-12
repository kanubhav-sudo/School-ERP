import { useState } from 'react'
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  Users,
  BookMarked,
  CalendarCheck,
  Clock,
  Bell,
  Megaphone,
  FileText,
  LogOut,
  Menu,
  X,
  Building2,
} from 'lucide-react'

export function TeacherLayout() {
  const { user, logout } = useAuth()
  const { schoolSlug } = useTenant()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('/teacher/my-classes')) return 'My Classes'
    if (path.includes('/teacher/homework')) return 'Homework'
    if (path.includes('/teacher/attendance')) return 'Attendance'
    if (path.includes('/teacher/timetable')) return 'Timetable'
    if (path.includes('/teacher/notices')) return 'Notices'
    if (path.includes('/teacher/announcements')) return 'Announcements'
    if (path.includes('/teacher/exams')) return 'Exams & Results'
    return 'Dashboard'
  }

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    }`

  const navigation = (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <NavLink
        to="/teacher/dashboard"
        onClick={() => setMobileOpen(false)}
        className={navItemClass}
      >
        <LayoutDashboard className="h-4 w-4 shrink-0" />
        Dashboard
      </NavLink>
      <NavLink
        to="/teacher/my-classes"
        onClick={() => setMobileOpen(false)}
        className={navItemClass}
      >
        <Users className="h-4 w-4 shrink-0" />
        My Classes
      </NavLink>
      <NavLink to="/teacher/homework" onClick={() => setMobileOpen(false)} className={navItemClass}>
        <BookMarked className="h-4 w-4 shrink-0" />
        Homework
      </NavLink>
      <NavLink
        to="/teacher/attendance"
        onClick={() => setMobileOpen(false)}
        className={navItemClass}
      >
        <CalendarCheck className="h-4 w-4 shrink-0" />
        Attendance
      </NavLink>
      <NavLink
        to="/teacher/timetable"
        onClick={() => setMobileOpen(false)}
        className={navItemClass}
      >
        <Clock className="h-4 w-4 shrink-0" />
        Timetable
      </NavLink>
      <NavLink to="/teacher/notices" onClick={() => setMobileOpen(false)} className={navItemClass}>
        <Bell className="h-4 w-4 shrink-0" />
        Notices
      </NavLink>
      <NavLink
        to="/teacher/announcements"
        onClick={() => setMobileOpen(false)}
        className={navItemClass}
      >
        <Megaphone className="h-4 w-4 shrink-0" />
        Announcements
      </NavLink>
      <NavLink to="/teacher/exams" onClick={() => setMobileOpen(false)} className={navItemClass}>
        <FileText className="h-4 w-4 shrink-0" />
        Exams & Results
      </NavLink>
    </nav>
  )

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-card flex-col shrink-0 shadow-sm">
        <div className="h-16 border-b flex items-center justify-between px-5 font-bold text-lg text-primary">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-extrabold text-sm shadow-sm">
              C
            </div>
            <span>CloudEMS</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono capitalize">
            Teacher
          </Badge>
        </div>
        {navigation}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 w-72 max-w-xs bg-card h-full flex flex-col shadow-xl border-r">
            <div className="h-16 border-b flex items-center justify-between px-5 font-bold text-lg text-primary">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-extrabold text-sm">
                  C
                </div>
                <span>CloudEMS</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {navigation}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <span>Teacher</span>
                <span>/</span>
                <span className="text-foreground">{getPageTitle()}</span>
              </div>
              <h2 className="text-base md:text-lg font-bold tracking-tight text-foreground leading-none mt-0.5">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs text-muted-foreground font-medium border">
              <Building2 className="h-3.5 w-3.5" />
              <span className="capitalize">{schoolSlug}</span>
            </div>
            <div className="text-right text-xs hidden sm:block">
              <p className="font-semibold text-foreground leading-tight">{user?.username}</p>
              <p className="text-[10px] text-muted-foreground">{user?.role}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2 h-9 border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
