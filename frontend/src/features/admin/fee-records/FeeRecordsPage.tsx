import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchStudentFeeList, type StudentFeeRow } from './api'
import { fetchSessions } from '@/features/admin/academic-sessions/api'
import { fetchClasses } from '@/features/admin/classes/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StudentFeeProfileDrawer } from './components/StudentFeeProfileDrawer'
import { User, Search, IndianRupee } from 'lucide-react'

export function FeeRecordsPage() {
  const [page, setPage] = useState(1)
  const [sessionId, setSessionId] = useState('')
  const [classId, setClassId] = useState('')
  const [search, setSearch] = useState('')

  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedStudentName, setSelectedStudentName] = useState('')

  const { data: sessions = [] } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: fetchSessions,
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['student-fee-list', { page, sessionId, classId, search }],
    queryFn: () =>
      fetchStudentFeeList({
        page,
        sessionId: sessionId || undefined,
        classId: classId || undefined,
        search: search || undefined,
      }),
  })

  const formatINR = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format((paise || 0) / 100)
  }

  const studentRows: StudentFeeRow[] = data?.students || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Records</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Class-wise student fee profiles, timeline, and payment management
          </p>
        </div>
      </div>

      {/* Filters (Search Student, Class Filter, Session - NO Section Filter) */}
      <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student name or admission number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9 h-10"
          />
        </div>

        <select
          value={sessionId}
          onChange={(e) => {
            setSessionId(e.target.value)
            setPage(1)
          }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Sessions</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value)
            setPage(1)
          }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[160px]"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Student Fee List Table */}
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/60 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold">Student Name</th>
                <th className="px-4 py-3 font-semibold">Admission No</th>
                <th className="px-4 py-3 font-semibold">Fee Category</th>
                <th className="px-4 py-3 font-semibold">Monthly Fee</th>
                <th className="px-4 py-3 font-semibold">Current Total Fee</th>
                <th className="px-4 py-3 font-semibold">Paid</th>
                <th className="px-4 py-3 font-semibold">Pending</th>
                <th className="px-4 py-3 font-semibold">Balance</th>
                <th className="px-4 py-3 font-semibold">Pending From</th>
                <th className="px-4 py-3 font-semibold text-center">Monthly Timeline</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                    Loading student fee records...
                  </td>
                </tr>
              ) : studentRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                    No students found for the selected filters.
                  </td>
                </tr>
              ) : (
                studentRows.map((row) => (
                  <tr
                    key={row.studentId}
                    className="hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedStudentId(row.studentId)
                      setSelectedStudentName(row.studentName)
                      setProfileDrawerOpen(true)
                    }}
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-foreground">{row.studentName}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.className} {row.sectionName ? `(${row.sectionName})` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                      {row.admissionNumber}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className="text-xs font-normal">
                        {row.feeCategory}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-medium">{formatINR(row.monthlyFee)}</td>
                    <td className="px-4 py-3.5 font-medium text-foreground">
                      {formatINR(row.currentTotalFee)}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-emerald-600">
                      {formatINR(row.paidAmount)}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-rose-600">
                      {formatINR(row.pendingAmount)}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-blue-600">
                      {row.advanceBalance > 0 ? formatINR(row.advanceBalance) : '₹0'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {row.pendingFrom === 'Cleared' ? (
                        <span className="text-emerald-600 font-medium">Cleared</span>
                      ) : (
                        row.pendingFrom
                      )}
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {row.timeline?.map((m) => (
                          <span
                            key={m.month}
                            title={`${m.label}: ${m.displayText || m.status}`}
                            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                              m.status === 'VACATION'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                : m.status === 'PAID'
                                  ? 'bg-emerald-500 text-white'
                                  : m.status === 'PARTIAL'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-muted text-muted-foreground border border-border'
                            }`}
                          >
                            {m.status === 'VACATION' ? 'V' : m.displayText || '·'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStudentId(row.studentId)
                          setSelectedStudentName(row.studentName)
                          setProfileDrawerOpen(true)
                        }}
                      >
                        <User className="h-3.5 w-3.5 mr-1" />
                        Fee Profile
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination controls */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(data.pagination.page - 1) * data.pagination.limit + 1}–
            {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
            {data.pagination.total} students
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="px-2 py-1 text-xs border rounded-md bg-muted">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {selectedStudentId && (
        <StudentFeeProfileDrawer
          studentId={selectedStudentId}
          studentName={selectedStudentName}
          open={profileDrawerOpen}
          onOpenChange={setProfileDrawerOpen}
        />
      )}
    </div>
  )
}
