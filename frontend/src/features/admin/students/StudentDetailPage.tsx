import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchStudent } from './api'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { AccountManagementCard } from '@/features/admin/accounts/components/AccountManagementCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const {
    data: student,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['student', id],
    queryFn: () => fetchStudent(id!),
    enabled: !!id,
  })

  if (isLoading) return <div>Loading...</div>
  if (error || !student) return <div>Student not found</div>

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/students')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Student Profile: {student.firstName} {student.lastName}
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
                  <p className="text-muted-foreground">Admission No</p>
                  <p className="font-medium">{student.admissionNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Roll No</p>
                  <p className="font-medium">{student.rollNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{student.email || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{student.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Gender</p>
                  <p className="font-medium">{student.gender}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {student.dateOfBirth ? format(new Date(student.dateOfBirth), 'PP') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Blood Group</p>
                  <p className="font-medium">{student.bloodGroup || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{student.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Class</p>
                  <p className="font-medium">{student.class?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Section</p>
                  <p className="font-medium">{student.section?.name || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <AccountManagementCard userId={student.userId} />
        </div>
      </div>
    </div>
  )
}
