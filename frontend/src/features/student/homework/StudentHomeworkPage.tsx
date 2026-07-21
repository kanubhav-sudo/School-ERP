import { useQuery } from '@tanstack/react-query'
import { studentPortalApi } from '../api/student-portal.api'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Calendar, User, Paperclip, ClipboardList } from 'lucide-react'
import { format, isPast } from 'date-fns'

interface HomeworkItem {
  id: string
  title: string
  description: string | null
  dueDate: string
  attachmentUrl: string | null
  marks: number | null
  subject: { id: string; name: string }
  teacher: { firstName: string; lastName: string }
  submissionStatus: string
  submissionRemarks: string | null
  submittedAt: string | null
}

function StatusBadge({ status, dueDate }: { status: string; dueDate: string }) {
  const overdue = isPast(new Date(dueDate)) && status === 'ASSIGNED'
  if (overdue) return <Badge variant="destructive">Overdue</Badge>
  switch (status) {
    case 'ASSIGNED': return <Badge variant="outline" className="text-yellow-600 border-yellow-500">Pending</Badge>
    case 'SUBMITTED': return <Badge className="bg-blue-500 hover:bg-blue-600">Submitted</Badge>
    case 'GRADED': return <Badge className="bg-green-500 hover:bg-green-600">Graded</Badge>
    case 'LATE': return <Badge variant="destructive">Late</Badge>
    default: return <Badge variant="secondary">{status}</Badge>
  }
}

export function StudentHomeworkPage() {
  const { data = [], isLoading } = useQuery<HomeworkItem[]>({
    queryKey: ['student-homework'],
    queryFn: studentPortalApi.getHomework,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading homework...
      </div>
    )
  }

  const pending = data.filter(h => h.submissionStatus === 'ASSIGNED' || h.submissionStatus === 'LATE')
  const submitted = data.filter(h => h.submissionStatus === 'SUBMITTED' || h.submissionStatus === 'GRADED')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Homework & Assignments</h1>
        <p className="text-sm text-muted-foreground mt-1">View all assignments for your class and section.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-card border rounded-xl">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold mt-1">{data.length}</p>
        </div>
        <div className="p-4 bg-card border rounded-xl">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{pending.length}</p>
        </div>
        <div className="p-4 bg-card border rounded-xl">
          <p className="text-xs text-muted-foreground">Submitted</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{submitted.length}</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl h-64 text-center p-8">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No homework assigned</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Your teacher hasn't assigned any homework yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((hw) => {
            const isOverdue = isPast(new Date(hw.dueDate)) && hw.submissionStatus === 'ASSIGNED'
            return (
              <div
                key={hw.id}
                className={`p-5 bg-card border rounded-xl space-y-3 hover:shadow-md transition-shadow ${
                  isOverdue ? 'border-red-200 dark:border-red-900' : ''
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold leading-tight">{hw.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{hw.subject.name}</p>
                    </div>
                  </div>
                  <StatusBadge status={hw.submissionStatus} dueDate={hw.dueDate} />
                </div>

                {/* Description */}
                {hw.description && (
                  <p className="text-sm text-muted-foreground">{hw.description}</p>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: <span className={`font-medium ml-0.5 ${isOverdue ? 'text-red-500' : ''}`}>
                      {format(new Date(hw.dueDate), 'dd MMM yyyy')}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {hw.teacher.firstName} {hw.teacher.lastName}
                  </span>
                  {hw.marks != null && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {hw.marks} marks
                    </span>
                  )}
                </div>

                {/* Attachment */}
                {hw.attachmentUrl && (
                  <a
                    href={hw.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                  >
                    <Paperclip className="h-3 w-3" />
                    View Attachment
                  </a>
                )}

                {/* Submission info */}
                {hw.submittedAt && (
                  <div className="text-xs text-green-600 bg-green-50 dark:bg-green-950/20 px-3 py-1.5 rounded-md">
                    Submitted on {format(new Date(hw.submittedAt), 'dd MMM yyyy, hh:mm a')}
                  </div>
                )}
                {hw.submissionRemarks && (
                  <div className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
                    Teacher remarks: {hw.submissionRemarks}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
