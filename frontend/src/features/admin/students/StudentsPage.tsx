import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { fetchStudents, deleteStudent, type Student, type StudentFilters } from './api'
import { StudentForm } from './components/StudentForm'
import { CredentialDisplayDialog } from '@/features/admin/accounts/components/CredentialDisplayDialog'

const STUDENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  TRANSFERRED: 'Transferred',
  GRADUATED: 'Graduated',
  EXPELLED: 'Expelled',
}

const STUDENT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-700',
  TRANSFERRED: 'bg-blue-100 text-blue-700',
  GRADUATED: 'bg-purple-100 text-purple-700',
  EXPELLED: 'bg-red-100 text-red-700',
}

export function StudentsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [credentials, setCredentials] = useState<{
    username: string
    temporaryPassword?: string
  } | null>(null)
  const [filters, setFilters] = useState<StudentFilters>({ page: 1, limit: 20 })
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['students', filters],
    queryFn: () => fetchStudents(filters),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
  })

  const students = data?.students ?? []
  const pagination = data?.pagination

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }))
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingStudent(null)
    setIsFormOpen(true)
  }

  const handleDelete = (student: Student) => {
    if (
      confirm(
        `Archive student "${student.firstName} ${student.lastName}"? They will be marked inactive.`
      )
    ) {
      deleteMutation.mutate(student.id)
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Students</h1>
        <Button onClick={handleCreate}>Add Student</Button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3">
        <Input
          placeholder="Search by name, admission no, or roll no..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
        {filters.search && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchInput('')
              setFilters((prev) => ({ ...prev, search: undefined, page: 1 }))
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admission No</TableHead>
              <TableHead>Roll No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Fee Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-mono text-sm">{student.admissionNumber}</TableCell>
                <TableCell>{student.rollNumber ?? '—'}</TableCell>
                <TableCell className="font-medium">
                  {student.firstName} {student.lastName}
                </TableCell>
                <TableCell>{student.class?.name ?? '—'}</TableCell>
                <TableCell>{student.section?.name ?? '—'}</TableCell>
                <TableCell>
                  {student.feePlan ? (
                    <span className="text-sm">{student.feePlan.name}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      STUDENT_STATUS_COLORS[student.status] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {STUDENT_STATUS_LABELS[student.status] ?? student.status}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/students/${student.id}`)}
                  >
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(student)}>
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(student)}
                    disabled={deleteMutation.isPending}
                  >
                    Archive
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {students.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      {isFormOpen && (
        <StudentForm
          student={editingStudent}
          onClose={() => setIsFormOpen(false)}
          onSuccess={(creds) => {
            if (creds) setCredentials(creds)
          }}
        />
      )}

      <CredentialDisplayDialog
        open={!!credentials}
        onOpenChange={(open) => !open && setCredentials(null)}
        username={credentials?.username ?? ''}
        temporaryPassword={credentials?.temporaryPassword}
      />
    </div>
  )
}
