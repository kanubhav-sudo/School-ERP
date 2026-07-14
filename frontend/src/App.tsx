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
import { MyClassesPage } from './features/teacher/my-classes/MyClassesPage'
import { HomeworkPlaceholderPage } from './features/teacher/homework/HomeworkPlaceholderPage'
import { TeacherAttendancePage } from './features/teacher/attendance/TeacherAttendancePage'
import { StudentDashboard } from './features/student/dashboard/StudentDashboard'
import { AcademicSessionsPage } from './features/admin/academic-sessions/AcademicSessionsPage'
import { ClassesPage } from './features/admin/classes/ClassesPage'
import { SectionsPage } from './features/admin/sections/SectionsPage'
import { SubjectsPage } from './features/admin/subjects/SubjectsPage'
import { TeachersPage } from './features/admin/teachers/TeachersPage'
import { StudentsPage } from './features/admin/students/StudentsPage'
import { TimetablePage } from './features/admin/timetable/TimetablePage'
import { AttendancePage } from './features/admin/attendance/AttendancePage'
import { NoticesPage } from './features/admin/notices/NoticesPage'
import { TeacherDetailPage } from './features/admin/teachers/TeacherDetailPage'
import { StudentDetailPage } from './features/admin/students/StudentDetailPage'
import { ChangePasswordPage } from './features/admin/accounts/ChangePasswordPage'
import { FeePlansPage } from './features/admin/fee-plans/FeePlansPage'
import { FeeRecordsPage } from './features/admin/fee-records/FeeRecordsPage'
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

            {/* Protected Change Password Route */}
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
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
              <Route path="teachers/:id" element={<TeacherDetailPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="students/:id" element={<StudentDetailPage />} />
              <Route path="timetable" element={<TimetablePage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="notices" element={<NoticesPage />} />
              <Route path="finance/fee-plans" element={<FeePlansPage />} />
              <Route path="finance/fee-records" element={<FeeRecordsPage />} />
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
              <Route path="my-classes" element={<MyClassesPage />} />
              <Route path="homework" element={<HomeworkPlaceholderPage />} />
              <Route path="attendance" element={<TeacherAttendancePage />} />
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
