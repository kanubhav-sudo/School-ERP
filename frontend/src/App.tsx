import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages & Layouts
import { LoginPage } from './features/auth/pages/LoginPage'
import { AdminLayout } from './layouts/AdminLayout'
import { TeacherLayout } from './layouts/TeacherLayout'
import { StudentLayout } from './layouts/StudentLayout'
import { Unauthorized } from './pages/Unauthorized'
import { NotFound } from './pages/NotFound'

// Dashboards & Features
import { AdminDashboard } from './features/admin/dashboard/AdminDashboard'
import { TeacherDashboard } from './features/teacher/dashboard/TeacherDashboard'
import { StudentDashboard } from './features/student/dashboard/StudentDashboard'
import { AcademicSessionsPage } from './features/admin/academic-sessions/AcademicSessionsPage'
import { ClassesPage } from './features/admin/classes/ClassesPage'
import { SectionsPage } from './features/admin/sections/SectionsPage'
import { SubjectsPage } from './features/admin/subjects/SubjectsPage'
import { TeachersPage } from './features/admin/teachers/TeachersPage'
import { StudentsPage } from './features/admin/students/StudentsPage'
// Route Guards
import { GuestRoute, ProtectedRoute, RoleRoute, getDashboardPath } from './routes/guards'

const queryClient = new QueryClient()

function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null // Let the AuthLoader inside ProtectedRoute handle loading UX
  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />
  }
  return <Navigate to="/login" replace />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Base Redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public / Guest Routes */}
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['ADMIN']}>
                    <AdminLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="academic-sessions" element={<AcademicSessionsPage />} />
              <Route path="classes" element={<ClassesPage />} />
              <Route path="sections" element={<SectionsPage />} />
              <Route path="subjects" element={<SubjectsPage />} />
              <Route path="teachers" element={<TeachersPage />} />
              <Route path="students" element={<StudentsPage />} />
            </Route>

            {/* Protected Teacher Routes */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['TEACHER']}>
                    <TeacherLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TeacherDashboard />} />
            </Route>

            {/* Protected Student Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute>
                  <RoleRoute roles={['STUDENT']}>
                    <StudentLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
            </Route>

            {/* Error Pages */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
