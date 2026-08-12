import { useState } from 'react'
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTenant } from '../context/TenantContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  Calendar,
  School,
  Grid,
  BookOpen,
  Users,
  GraduationCap,
  Clock,
  Settings2,
  CalendarCheck,
  Bell,
  BookMarked,
  FileText,
  FileSpreadsheet,
  Receipt,
  Landmark,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
} from 'lucide-react'

export function AdminLayout() {
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
    if (path.includes('/admin/academic-sessions')) return 'Academic Sessions'
    if (path.includes('/admin/classes')) return 'Classes'
    if (path.includes('/admin/sections')) return 'Sections'
    if (path.includes('/admin/subjects')) return 'Subjects'
    if (path.includes('/admin/teachers')) return 'Teachers'
    if (path.includes('/admin/students')) return 'Students'
    if (path.includes('/admin/timetable')) return 'Timetable'
    if (path.includes('/admin/period-master')) return 'Period Master'
    if (path.includes('/admin/attendance')) return 'Attendance'
    if (path.includes('/admin/notices')) return 'Noticeboard'
    if (path.includes('/admin/homework')) return 'Homework'
    if (path.includes('/admin/exams')) return 'Exams & Results'
    if (path.includes('/admin/documents')) return 'Document Engine'
    if (path.includes('/admin/finance/fee-plans')) return 'Fee Plans'
    if (path.includes('/admin/finance/fee-records')) return 'Fee Records'
    if (path.includes('/admin/settings')) return 'Settings & Subscription'
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
      <div className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider px-3 mb-1">
        Core Setup
      </div>
      <NavLink to="/admin/dashboard" onClick={() => setMobileOpen(false)} className={navItemClass}>
        <LayoutDashboard className="h-4 w-4 shrink-0" />
        Dashboard
      </NavLink>
      <NavLink
        to="/admin/academic-sessions"
        onClick={() => setMobileOpen(false)}
        className={navItemClass}
      >
        <Calendar className="h-4 w-4 shrink-0" />
        Academic Sessions
      </NavLink>
      <NavLink to="/admin/classes" onClick={() => setMobileOpen(false)} className={navItemClass}>
        <School className="h-4 w-4 shrink-0" />
        Classes
      </NavLink>
      <NavLink to="/admin/sections" onClick={() => setMobileOpen(false)} className={navItemClass}>
        <Grid className="h-4 w-4 shrink-0" />
        Sections
      </NavLink>
      <NavLink to="/admin/subjects" onClick={() => setMobileOpen(false)} className={navItemClass}>
        <BookOpen className="h-4 w-4 shrink-0" />
        Subjects
      </NavLink>

      <div className="pt-4 pb-1 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider px-3">
        People Management
      </div>
      <NavLink to="/admin/teachers" onClick={() => setMobileOpen(false)} className={navItemClass}>
        <Users className="h-4 w-4 shrink-0" />
        Teachers
      </NavLink>
      <NavLink to="/admin/students" onClick={() => setMobileOpen(false)} className={navItemClass}>
        <GraduationCap className="h-4 w-4 shrink-0" />
        Students
      </NavLink>

      <div className="pt-4 pb-1 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider px-3">
        Operations
      </div>
      <NavLink to="/admin/timetable" onClick={() => setMobileOpen(false)} className={navItemClass}>
        <Clock className="h-4 w-4 shrink-0" />
        Timetable
      </NavLink>
      <NavLink
        to="/admin/period-master"
        onClick={() => setMobileOpen(false)}
        className={navItemClass}
      >
        <Settings2 className="h-4 w-4 shrink-0" />
        Period Master
      </NavLink>
      <NavLink to="/admin/attendance" onClick={() => setMobileOpen(false)} className={navItemClass}>
        <CalendarCheck className="h-4 w-4 shrink-0" />
        Attendance
      </NavLink>
      <NavLink to="/admin/notices" onClick={() => setMobileOpen(false)} className={navItemClass}>
        <Bell className="h-4 w-4 shrink-0" />
        Noticeboard
      </NavLink>
      <NavLink to="/admin/homework" onClick={() => setMobileOpen(false)} className={navItemClass}>
        <BookMarked className="h-4 w-4 shrink-0" />
        Homework
      </NavLink>
      <NavLink to="/admin/exams" onClick={() => setMobileOpen(false)} className={navItemClass}>
        <FileText className="h-4 w-4 shrink-0" />
        Exams & Results
      </NavLink>
      <NavLink to="/admin/documents" onClick={() => setMobileOpen(false)} className={navItemClass}>
        <FileSpreadsheet className="h-4 w-4 shrink-0" />
        Document Engine
      </NavLink>

      <div className="pt-4 pb-1 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider px-3">
        Finance & Billing
      </div>
      <NavLink
        to="/admin/finance/fee-plans"
        onClick={() => setMobileOpen(false)}
        className={navItemClass}
      >
        <Receipt className="h-4 w-4 shrink-0" />
        Fee Plans
      </NavLink>
      <NavLink
        to="/admin/finance/fee-records"
        onClick={() => setMobileOpen(false)}
        className={navItemClass}
      >
        <Landmark className="h-4 w-4 shrink-0" />
        Fee Records
      </NavLink>

      <div className="pt-4 pb-1 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider px-3">
        System Settings
      </div>
      <NavLink to="/admin/settings" onClick={() => setMobileOpen(false)} className={navItemClass}>
        <Settings className="h-4 w-4 shrink-0" />
        Settings & Subscription
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
            {schoolSlug || 'demo'}
          </Badge>
        </div>
        {navigation}
      </aside>

      {/* Mobile Backdrop & Drawer */}
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
        {/* Header */}
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
                <span>Admin</span>
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

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
