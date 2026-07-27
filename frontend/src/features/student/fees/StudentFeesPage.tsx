import { useQuery } from '@tanstack/react-query'
import { studentPortalApi } from '../api/student-portal.api'
import { Badge } from '@/components/ui/badge'
import { Receipt } from 'lucide-react'
import { format } from 'date-fns'

export function StudentFeesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-fees'],
    queryFn: studentPortalApi.getFees,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading student fee profile...
      </div>
    )
  }

  const fmt = (paise: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
      (paise || 0) / 100
    )

  const summary = data?.summary
  const student = data?.student
  const payments = (data?.payments || []) as Array<{
    id: string
    receiptNumber: string
    amount: number
    paymentDate: string
    paymentMode: string
    remarks?: string
    createdAt: string
  }>
  const timeline = (data?.timeline || []) as Array<{
    month: number
    label: string
    status: string
    displayText: string
  }>

  return (
    <div className="space-y-6">
      {/* Student Details Header */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {student?.firstName} {student?.lastName}
            </h1>
            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              {student?.admissionNumber && (
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                  {student.admissionNumber}
                </span>
              )}
              {student?.className && <span>{student.className}</span>}
              {student?.sectionName && <span>({student.sectionName})</span>}
              {student?.sessionName && <span>· {student.sessionName}</span>}
            </div>
          </div>
          {student?.feePlan && (
            <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground flex flex-wrap gap-4 items-center border border-border">
              <div>
                Fee Plan: <span className="font-semibold text-foreground">{student.feePlan.name}</span>
              </div>
              <div>
                Monthly Fee:{' '}
                <span className="font-semibold text-foreground">
                  {fmt(student.feePlan.monthlyAmount)}
                </span>
              </div>
              <div>
                Fee Category:{' '}
                <Badge variant="outline" className="text-[11px] font-normal">
                  {student?.feeCategory || 'STANDARD'}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-card rounded-xl border border-border text-center shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">Total Fee (Current)</p>
          <p className="text-xl font-bold mt-1 text-foreground">{fmt(summary?.totalFees || 0)}</p>
        </div>
        <div className="p-4 bg-card rounded-xl border border-border text-center shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">Paid Amount</p>
          <p className="text-xl font-bold mt-1 text-emerald-600">{fmt(summary?.paidAmount || 0)}</p>
        </div>
        <div className="p-4 bg-card rounded-xl border border-border text-center shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">Pending Amount</p>
          <p
            className={`text-xl font-bold mt-1 ${
              (summary?.pendingAmount || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {fmt(summary?.pendingAmount || 0)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {summary?.pendingFrom ? `From ${summary.pendingFrom}` : 'Cleared'}
          </p>
        </div>
        <div className="p-4 bg-card rounded-xl border border-border text-center shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">Advance Balance</p>
          <p className="text-xl font-bold mt-1 text-blue-600">
            {fmt(summary?.advanceBalance || 0)}
          </p>
        </div>
      </div>

      {/* 12-Month Academic Timeline */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
        <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
          Monthly Timeline (Apr → Mar)
        </h3>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
          {timeline.map((m) => (
            <div
              key={m.month}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center text-xs ${
                m.status === 'VACATION'
                  ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300'
                  : m.status === 'PAID'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 font-bold'
                    : m.status === 'PARTIAL'
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300'
                      : 'bg-card border-border text-muted-foreground'
              }`}
            >
              <span className="text-[10px] font-semibold">{m.label?.slice(0, 3)}</span>
              <span className="text-xs mt-1 font-bold">
                {m.status === 'VACATION' ? 'Vacation' : m.displayText || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History & Receipts */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
        <h3 className="text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
          Payment History & Receipt History
        </h3>
        {payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
            No fee payment receipts found for this session.
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between p-4 bg-muted/20 border rounded-lg text-sm gap-2"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-muted">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-bold text-base">{fmt(p.amount)}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>Receipt #{p.receiptNumber}</span>
                      <span>·</span>
                      <span>{p.paymentMode?.replace('_', ' ')}</span>
                    </div>
                    {p.remarks && (
                      <p className="text-xs text-muted-foreground italic mt-0.5">
                        {p.remarks}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground font-medium">
                  {format(new Date(p.paymentDate || p.createdAt), 'dd MMM yyyy')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
