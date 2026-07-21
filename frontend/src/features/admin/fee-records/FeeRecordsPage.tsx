import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchFeeRecords, type FeeRecord } from './api'
import { fetchSessions } from '@/features/admin/academic-sessions/api'
import { fetchClasses } from '@/features/admin/classes/api'
import { fetchSections } from '@/features/admin/sections/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FeePaymentDialog } from './components/FeePaymentDialog'

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

export function FeeRecordsPage() {
  const [page, setPage] = useState(1)
  const [sessionId, setSessionId] = useState('')
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [month, setMonth] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
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

  const { data: sections = [] } = useQuery({
    queryKey: ['sections', classId],
    queryFn: () => fetchSections({ classId }),
    enabled: !!classId,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['fee-records', { page, sessionId, classId, sectionId, month, status, search, sortBy }],
    queryFn: () =>
      fetchFeeRecords({
        page,
        sessionId: sessionId || undefined,
        classId: classId || undefined,
        sectionId: sectionId || undefined,
        month: month ? Number(month) : undefined,
        status: status || undefined,
        search: search || undefined,
        sortBy: sortBy || undefined,
      }),
  })

  const formatINR = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(paise / 100)
  }

  const feeRecords = data?.feeRecords || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Fee Records</h1>
      </div>

      <div className="flex flex-wrap gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        <Input
          placeholder="Search student or receipt..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="h-10 w-64"
        />
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
            setSectionId('') // reset section when class changes
            setPage(1)
          }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={sectionId}
          onChange={(e) => {
            setSectionId(e.target.value)
            setPage(1)
          }}
          disabled={!classId}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
        >
          <option value="">All Sections</option>
          {sections.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={month}
          onChange={(e) => {
            setMonth(e.target.value)
            setPage(1)
          }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Months</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PARTIAL">Partially Paid</option>
          <option value="PAID">Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value)
            setPage(1)
          }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm ml-auto"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Amount</option>
          <option value="lowest">Lowest Amount</option>
          <option value="name">Student Name</option>
        </select>
      </div>

      <div className="border rounded-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Student Name</th>
                <th className="px-4 py-3 font-medium">Class & Session</th>
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">Monthly Fee</th>
                <th className="px-4 py-3 font-medium">Amount Paid</th>
                <th className="px-4 py-3 font-medium">Balance</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Loading fee records...
                  </td>
                </tr>
              ) : feeRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No fee records found for the selected filters.
                  </td>
                </tr>
              ) : (
                feeRecords.map((record: FeeRecord) => (
                  <tr key={record.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {record.student.firstName} {record.student.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {record.student.admissionNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{record.class.name}</div>
                      <div className="text-xs text-muted-foreground">{record.session.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      {MONTHS.find((m) => m.value === record.month)?.label || record.month}{' '}
                      {record.year}
                    </td>
                    <td className="px-4 py-3">{formatINR(record.netAmount)}</td>
                    <td className="px-4 py-3 text-green-600">{formatINR(record.paidAmount)}</td>
                    <td className="px-4 py-3 text-red-600 font-medium">
                      {formatINR(record.balanceAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'PAID'
                            ? 'bg-green-100 text-green-700'
                            : record.status === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-700'
                              : record.status === 'WAIVED'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {record.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {record.status !== 'PAID' && record.status !== 'WAIVED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStudentId(record.studentId)
                            setSelectedStudentName(`${record.student.firstName} ${record.student.lastName}`)
                            setPaymentDialogOpen(true)
                          }}
                        >
                          Receive Fee
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination controls can be added here */}

      {selectedStudentId && (
        <FeePaymentDialog
          studentId={selectedStudentId}
          studentName={selectedStudentName}
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
        />
      )}
    </div>
  )
}
