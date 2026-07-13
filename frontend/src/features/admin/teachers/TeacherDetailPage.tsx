import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchTeacher,
  addTeacherAssignment,
  removeTeacherAssignment,
  type TeacherAssignment,
} from './api'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Briefcase,
  GraduationCap,
  MapPin,
  AlertCircle,
  Shield,
  BookOpen,
  Star,
  Trash2,
} from 'lucide-react'
import { AccountManagementCard } from '@/features/admin/accounts/components/AccountManagementCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { useState } from 'react'
import { fetchClasses, type ClassData } from '@/features/admin/classes/api'
import { fetchSections, type SectionData } from '@/features/admin/sections/api'
import { fetchSubjects, type SubjectData } from '@/features/admin/subjects/api'
import { fetchSessions, type AcademicSession } from '@/features/admin/academic-sessions/api'

// ─── Label Maps ────────────────────────────────────────────────

const BLOOD_GROUP_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
}

const DESIGNATION_LABELS: Record<string, string> = {
  PRINCIPAL: 'Principal',
  VICE_PRINCIPAL: 'Vice Principal',
  COORDINATOR: 'Coordinator',
  SENIOR_TEACHER: 'Senior Teacher',
  TEACHER: 'Teacher',
  ASSISTANT_TEACHER: 'Assistant Teacher',
}

const STATUS_COLORS: Record<string, string> = {
  PERMANENT: 'bg-green-100 text-green-700',
  CONTRACT: 'bg-blue-100 text-blue-700',
  PROBATION: 'bg-yellow-100 text-yellow-700',
  RESIGNED: 'bg-gray-100 text-gray-600',
  TERMINATED: 'bg-red-100 text-red-700',
}

// ─── Info Row ──────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value?: string | null
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value || '—'}</p>
      </div>
    </div>
  )
}

// ─── Assignment Row ────────────────────────────────────────────

function AssignmentRow({
  assignment,
  onRemove,
  isRemoving,
}: {
  assignment: TeacherAssignment
  onRemove: (id: string) => void
  isRemoving: boolean
}) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="py-2.5 px-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span>{assignment.subject.name}</span>
          <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {assignment.subject.code}
          </span>
        </div>
      </td>
      <td className="py-2.5 px-4 text-sm">{assignment.class.name}</td>
      <td className="py-2.5 px-4 text-sm">{assignment.section.name}</td>
      <td className="py-2.5 px-4 text-sm">
        {assignment.isClassTeacher ? (
          <span className="flex items-center gap-1 text-yellow-600 font-medium">
            <Star className="h-3 w-3 fill-yellow-600" /> Class Teacher
          </span>
        ) : (
          <span className="text-muted-foreground">Subject</span>
        )}
      </td>
      <td className="py-2.5 px-4 text-sm text-muted-foreground">
        {assignment.session?.name ?? '—'}
      </td>
      <td className="py-2.5 px-4 text-right">
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
          onClick={() => onRemove(assignment.id)}
          disabled={isRemoving}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  )
}

// ─── Add Assignment Form ───────────────────────────────────────

function AddAssignmentForm({ teacherId, onSuccess }: { teacherId: string; onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const [sessionId, setSessionId] = useState('')
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [isClassTeacher, setIsClassTeacher] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: sessions } = useQuery<AcademicSession[]>({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
  })

  const { data: allClasses } = useQuery<ClassData[]>({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })

  const { data: allSections } = useQuery<SectionData[]>({
    queryKey: ['sections'],
    queryFn: fetchSections,
  })

  const { data: allSubjects } = useQuery<SubjectData[]>({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  })

  // Filter sections client-side by selected class
  const filteredSections = (allSections ?? []).filter((s) => !classId || s.classId === classId)

  const addMutation = useMutation({
    mutationFn: () =>
      addTeacherAssignment(teacherId, {
        sessionId,
        classId,
        sectionId,
        subjectId,
        isClassTeacher,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', teacherId] })
      queryClient.invalidateQueries({ queryKey: ['teacherStats'] })
      setSessionId('')
      setClassId('')
      setSectionId('')
      setSubjectId('')
      setIsClassTeacher(false)
      setError(null)
      onSuccess()
    },
    onError: (err: Error) => setError(err.message),
  })

  const canSubmit = sessionId && classId && sectionId && subjectId

  return (
    <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
      <p className="text-sm font-semibold">Add Assignment</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Session */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Session *</label>
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Select session</option>
            {(sessions ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Class */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Class *</label>
          <select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value)
              setSectionId('')
            }}
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Select class</option>
            {(allClasses ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Section */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Section *</label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
            disabled={!classId}
          >
            <option value="">Select section</option>
            {filteredSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Subject *</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Select subject</option>
            {(allSubjects ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        {/* Class Teacher flag */}
        <div className="space-y-1 flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer h-8">
            <input
              type="checkbox"
              checked={isClassTeacher}
              onChange={(e) => setIsClassTeacher(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm">Set as class teacher</span>
          </label>
        </div>

        {/* Submit */}
        <div className="flex items-end">
          <Button
            size="sm"
            className="h-8"
            onClick={() => addMutation.mutate()}
            disabled={!canSubmit || addMutation.isPending}
          >
            {addMutation.isPending ? 'Adding...' : 'Add Assignment'}
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────

export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)

  const {
    data: teacher,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['teacher', id],
    queryFn: () => fetchTeacher(id!),
    enabled: !!id,
  })

  const removeMutation = useMutation({
    mutationFn: ({ asgId }: { asgId: string }) => removeTeacherAssignment(id!, asgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', id] })
      queryClient.invalidateQueries({ queryKey: ['teacherStats'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Loading teacher profile...
      </div>
    )
  }
  if (error || !teacher) {
    return (
      <div className="flex items-center justify-center py-20 text-red-500 text-sm">
        Teacher not found
      </div>
    )
  }

  // Workload summary (client-side — no schema field needed)
  const assignments = teacher.assignments ?? []
  const uniqueSubjects = new Set(assignments.map((a) => a.subject.id)).size
  const uniqueClasses = new Set(assignments.map((a) => a.class.id)).size
  const classTeacherCount = assignments.filter((a) => a.isClassTeacher).length

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/teachers')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0 flex items-center gap-4">
          {teacher.photoUrl ? (
            <img
              src={teacher.photoUrl}
              alt={`${teacher.firstName} ${teacher.lastName}`}
              className="h-14 w-14 rounded-full object-cover border-2 border-border flex-shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <User className="h-7 w-7 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">
              {teacher.firstName} {teacher.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {DESIGNATION_LABELS[teacher.designation] ?? teacher.designation} ·{' '}
              <span className="font-mono">{teacher.employeeId}</span>
            </p>
          </div>
        </div>
        <span
          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
            teacher.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {teacher.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* ── Workload Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card text-center shadow-sm">
          <p className="text-2xl font-bold">{assignments.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Assignments</p>
        </div>
        <div className="border rounded-lg p-4 bg-card text-center shadow-sm">
          <p className="text-2xl font-bold">{uniqueSubjects}</p>
          <p className="text-xs text-muted-foreground mt-1">Unique Subjects</p>
        </div>
        <div className="border rounded-lg p-4 bg-card text-center shadow-sm">
          <p className="text-2xl font-bold">{uniqueClasses}</p>
          <p className="text-xs text-muted-foreground mt-1">Classes</p>
        </div>
        <div className="border rounded-lg p-4 bg-card text-center shadow-sm">
          <p className="text-2xl font-bold text-yellow-600">{classTeacherCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Class Teacher Of</p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info Cards */}
        <div className="space-y-4">
          {/* Personal */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 divide-y">
              <InfoRow icon={Mail} label="Email" value={teacher.email} />
              <InfoRow icon={Phone} label="Phone" value={teacher.phone} />
              <InfoRow icon={User} label="Gender" value={teacher.gender} />
              <InfoRow
                icon={User}
                label="Date of Birth"
                value={teacher.dateOfBirth ? format(new Date(teacher.dateOfBirth), 'PP') : null}
              />
              <InfoRow
                icon={Shield}
                label="Blood Group"
                value={teacher.bloodGroup ? BLOOD_GROUP_LABELS[teacher.bloodGroup] : null}
              />
              <InfoRow icon={MapPin} label="Address" value={teacher.address} />
            </CardContent>
          </Card>

          {/* Emergency */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 divide-y">
              <InfoRow icon={AlertCircle} label="Contact Name" value={teacher.emergencyContact} />
              <InfoRow icon={Phone} label="Contact Phone" value={teacher.emergencyPhone} />
            </CardContent>
          </Card>

          {/* Employment */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 divide-y">
              <InfoRow icon={Briefcase} label="Department" value={teacher.department} />
              <InfoRow
                icon={GraduationCap}
                label="Designation"
                value={DESIGNATION_LABELS[teacher.designation] ?? teacher.designation}
              />
              <InfoRow icon={BookOpen} label="Qualification" value={teacher.qualification} />
              <InfoRow
                icon={Briefcase}
                label="Experience"
                value={
                  teacher.experienceYears != null
                    ? `${teacher.experienceYears} yr${teacher.experienceYears !== 1 ? 's' : ''}`
                    : null
                }
              />
              <div className="flex items-start gap-3 py-2">
                <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Employment Status</p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_COLORS[teacher.employmentStatus] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {teacher.employmentStatus}
                  </span>
                </div>
              </div>
              <InfoRow
                icon={Briefcase}
                label="Joining Date"
                value={format(new Date(teacher.joiningDate), 'PP')}
              />
            </CardContent>
          </Card>

          {teacher.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Notes</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {teacher.notes}
                </p>
              </CardContent>
            </Card>
          )}

          <AccountManagementCard userId={teacher.userId} />
        </div>

        {/* Right: Assignments */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold">Teaching Assignments</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowAddForm((v) => !v)}>
                {showAddForm ? 'Cancel' : '+ Add Assignment'}
              </Button>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {showAddForm && (
                <AddAssignmentForm teacherId={teacher.id} onSuccess={() => setShowAddForm(false)} />
              )}

              {assignments.length > 0 ? (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">
                          Subject
                        </th>
                        <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">
                          Class
                        </th>
                        <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">
                          Section
                        </th>
                        <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">
                          Role
                        </th>
                        <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">
                          Session
                        </th>
                        <th className="py-2.5 px-4" />
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((asg) => (
                        <AssignmentRow
                          key={asg.id}
                          assignment={asg}
                          onRemove={(asgId) => removeMutation.mutate({ asgId })}
                          isRemoving={removeMutation.isPending}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm border rounded-md">
                  No assignments yet. Click &quot;+ Add Assignment&quot; to assign this teacher.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
