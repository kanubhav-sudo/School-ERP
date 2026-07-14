import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'

export function TeacherLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-muted/40">
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="h-16 border-b flex items-center px-6 font-bold text-lg text-primary">
          Teacher Portal
        </div>
        <nav className="flex-1 p-4 space-y-2 text-sm">
          <NavLink
            to="/teacher/dashboard"
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
            to="/teacher/my-classes"
            className={({ isActive }) =>
              `block p-2 rounded-md ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              }`
            }
          >
            My Classes
          </NavLink>
          <NavLink
            to="/teacher/homework"
            className={({ isActive }) =>
              `block p-2 rounded-md ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground'
              }`
            }
          >
            Homework
          </NavLink>
          <NavLink
            to="/teacher/attendance"
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
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
          <div className="font-medium">
            <span className="text-muted-foreground">Pages / </span> Dashboard
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
