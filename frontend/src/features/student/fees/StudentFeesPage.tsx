import { useQuery } from '@tanstack/react-query'
import { studentPortalApi } from '../api/student-portal.api'
import { Badge } from '@/components/ui/badge'
import { IndianRupee, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

const MONTH_NAMES: Record<number, string> = {
  1: 'January', 2: 'February', 3: 'March', 4: 'April',
  6: 'June', 7: 'July', 8: 'August', 9: 'September',
  10: 'October', 11: 'November', 12: 'December'
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'PAID':    return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>
    case 'PARTIAL': return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Partial</Badge>
    case 'PENDING': return <Badge variant="outline" className="text-yellow-600 border-yellow-500">Pending</Badge>
    case 'OVERDUE': return <Badge variant="destructive">Overdue</Badge>
    case 'WAIVED':  return <Badge className="bg-blue-500 hover:bg-blue-600">Waived</Badge>
    default:        return <Badge variant="secondary">{status}</Badge>
  }
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'PAID') return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
  if (status === 'OVERDUE') return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
  return <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
}

export function StudentFeesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-fees'],
    queryFn: studentPortalApi.getFees,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading fee details...
      </div>
    )
  }

  const records: any[] = data?.records || []
  const summary = data?.summary || { totalFees: 0, paidAmount: 0, pendingAmount: 0 }

  // Find first pending/overdue month for "Pending From" display
  const firstPending = records.find(r => r.status === 'PENDING' || r.status === 'OVERDUE' || r.status === 'PARTIAL')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fee Summary</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your fee records for the current academic session.
          <span className="ml-2 text-xs text-muted-foreground">(May is a vacation month — no fee charged)</span>
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Fees</h3>
          <div className="text-3xl font-bold mt-2 flex items-center gap-1">
            <IndianRupee className="h-6 w-6" />{summary.totalFees.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">For entire session (11 months)</p>
        </div>
        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Amount Paid</h3>
          <div className="text-3xl font-bold mt-2 text-green-600 flex items-center gap-1">
            <IndianRupee className="h-6 w-6" />{summary.paidAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {records.filter(r => r.status === 'PAID').length} month(s) fully paid
          </p>
        </div>
        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Pending Amount</h3>
          <div className={`text-3xl font-bold mt-2 flex items-center gap-1 ${summary.pendingAmount > 0 ? 'text-red-500' : 'text-green-600'}`}>
            <IndianRupee className="h-6 w-6" />{summary.pendingAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {firstPending
              ? `Pending from ${MONTH_NAMES[firstPending.month] || firstPending.month} ${firstPending.year}`
              : 'All clear'}
          </p>
        </div>
      </div>

      {/* Monthly Timeline */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/50">
          <h2 className="font-semibold">Monthly Fee Timeline</h2>
          <p className="text-xs text-muted-foreground mt-0.5">April → March (May excluded)</p>
        </div>

        {records.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No fee records found.</div>
        ) : (
          <div className="divide-y">
            {records.map((record: any) => (
              <div key={record.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <StatusIcon status={record.status} />
                  <div>
                    <p className="font-medium text-sm">
                      {MONTH_NAMES[record.month] || `Month ${record.month}`} {record.year}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {record.feePlan?.name || 'Standard Plan'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-medium">₹{(record.netAmount / 100).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="font-medium text-green-600">₹{(record.paidAmount / 100).toLocaleString('en-IN')}</p>
                  </div>
                  {record.balanceAmount > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="font-medium text-red-500">₹{(record.balanceAmount / 100).toLocaleString('en-IN')}</p>
                    </div>
                  )}
                  <StatusBadge status={record.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
