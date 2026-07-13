import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-muted/40">
      {/* Sidebar Placeholder */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="h-16 border-b flex items-center px-6 font-bold text-lg text-primary">
          Admin Portal
        </div>
        <nav className="flex-1 p-4 space-y-2 text-sm">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `block p-2 rounded-md ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/academic-sessions"
            className={({ isActive }) =>
              `block p-2 rounded-md ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              }`
            }
          >
            Academic Sessions
          </NavLink>
          <NavLink
            to="/admin/classes"
            className={({ isActive }) =>
              `block p-2 rounded-md ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              }`
            }
          >
            Classes
          </NavLink>
          <NavLink
            to="/admin/sections"
            className={({ isActive }) =>
              `block p-2 rounded-md ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              }`
            }
          >
            Sections
          </NavLink>
          <NavLink
            to="/admin/subjects"
            className={({ isActive }) =>
              `block p-2 rounded-md ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              }`
            }
          >
            Subjects
          </NavLink>
          <div className="pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            People
          </div>
          <NavLink
            to="/admin/teachers"
            className={({ isActive }) =>
              `block p-2 rounded-md ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              }`
            }
          >
            Teachers
          </NavLink>
          <NavLink
            to="/admin/students"
            className={({ isActive }) =>
              `block p-2 rounded-md ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              }`
            }
          >
            Students
          </NavLink>
          <div className="pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Operations
          </div>
          <NavLink
            to="/admin/timetable"
            className={({ isActive }) =>
              `block p-2 rounded-md ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              }`
            }
          >
            Timetable
          </NavLink>
          <NavLink
            to="/admin/attendance"
            className={({ isActive }) =>
              `block p-2 rounded-md ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              }`
            }
          >
            Attendance
          </NavLink>
          <NavLink
            to="/admin/notices"
            className={({ isActive }) =>
              `block p-2 rounded-md ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              }`
            }
          >
            Noticeboard
          </NavLink>
          <div className="pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Finance
          </div>
          <NavLink
            to="/admin/finance/fee-plans"
            className={({ isActive }) =>
              `block p-2 rounded-md ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              }`
            }
          >
            Fee Plans
          </NavLink>
          <NavLink
            to="/admin/finance/fee-records"
            className={({ isActive }) =>
              `block p-2 rounded-md ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              }`
            }
          >
            Fee Records
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar Placeholder */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
          <div className="font-medium">
            <span className="text-muted-foreground">Pages / </span> Dashboard
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
