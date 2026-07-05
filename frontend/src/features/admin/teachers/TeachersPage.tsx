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
import { fetchTeachers, deleteTeacher, type Teacher, type TeacherFilters } from './api'
import { TeacherForm } from './components/TeacherForm'
import { CredentialDisplayDialog } from '@/features/admin/accounts/components/CredentialDisplayDialog'
import { format } from 'date-fns'

const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  PERMANENT: 'Permanent',
  CONTRACT: 'Contract',
  PROBATION: 'Probation',
  RESIGNED: 'Resigned',
  TERMINATED: 'Terminated',
}

const EMPLOYMENT_STATUS_COLORS: Record<string, string> = {
  PERMANENT: 'bg-green-100 text-green-700',
  CONTRACT: 'bg-blue-100 text-blue-700',
  PROBATION: 'bg-yellow-100 text-yellow-700',
  RESIGNED: 'bg-gray-100 text-gray-600',
  TERMINATED: 'bg-red-100 text-red-700',
}

export function TeachersPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [credentials, setCredentials] = useState<{
    username: string
    temporaryPassword?: string
  } | null>(null)
  const [filters, setFilters] = useState<TeacherFilters>({ page: 1, limit: 20 })
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', filters],
    queryFn: () => fetchTeachers(filters),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
    },
  })

  const teachers = data?.teachers ?? []
  const pagination = data?.pagination

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }))
  }

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingTeacher(null)
    setIsFormOpen(true)
  }

  const handleDelete = (teacher: Teacher) => {
    if (
      confirm(
        `Archive teacher "${teacher.firstName} ${teacher.lastName}"? They will be marked inactive.`
      )
    ) {
      deleteMutation.mutate(teacher.id)
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Teachers</h1>
        <Button onClick={handleCreate}>Add Teacher</Button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3">
        <Input
          placeholder="Search by name, email, or ID..."
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
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell className="font-mono text-sm">{teacher.employeeId}</TableCell>
                <TableCell className="font-medium">
                  {teacher.firstName} {teacher.lastName}
                </TableCell>
                <TableCell>{teacher.department ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{teacher.email}</TableCell>
                <TableCell>{format(new Date(teacher.joiningDate), 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      EMPLOYMENT_STATUS_COLORS[teacher.employmentStatus] ??
                      'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {EMPLOYMENT_STATUS_LABELS[teacher.employmentStatus] ?? teacher.employmentStatus}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/teachers/${teacher.id}`)}
                  >
                    View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(teacher)}>
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(teacher)}
                    disabled={deleteMutation.isPending}
                  >
                    Archive
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {teachers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No teachers found.
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
        <TeacherForm
          teacher={editingTeacher}
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
