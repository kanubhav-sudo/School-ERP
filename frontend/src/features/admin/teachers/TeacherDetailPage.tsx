import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchTeacher } from './api'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { AccountManagementCard } from '@/features/admin/accounts/components/AccountManagementCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'

export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    data: teacher,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['teacher', id],
    queryFn: () => fetchTeacher(id!),
    enabled: !!id,
  })

  if (isLoading) return <div>Loading...</div>
  if (error || !teacher) return <div>Teacher not found</div>

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/teachers')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Teacher Profile: {teacher.firstName} {teacher.lastName}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{teacher.employeeId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{teacher.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{teacher.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gender</p>
                  <p className="font-medium">{teacher.gender}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {teacher.dateOfBirth ? format(new Date(teacher.dateOfBirth), 'PP') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Joining Date</p>
                  <p className="font-medium">{format(new Date(teacher.joiningDate), 'PP')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-medium">{teacher.department || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Employment Status</p>
                  <p className="font-medium">{teacher.employmentStatus}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <AccountManagementCard userId={teacher.userId} />
        </div>
      </div>
    </div>
  )
}
