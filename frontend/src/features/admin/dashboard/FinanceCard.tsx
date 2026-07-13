import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchSessions } from '@/features/admin/academic-sessions/api'
import { fetchFeeSummary } from '@/features/admin/fee-records/api'

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

export function FinanceCard() {
  const [metric, setMetric] = useState<'PENDING' | 'PAID'>('PENDING')
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')

  const { data: sessions = [] } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: fetchSessions,
  })

  // Fallback to active session if none selected
  const activeSessionId = sessions.find((s) => s.isActive)?.id || sessions[0]?.id || ''
  const sessionId = selectedSessionId || activeSessionId

  // Fetch actual fee summary from the backend
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['fee-summary', { sessionId, month }],
    queryFn: () => fetchFeeSummary(sessionId, month),
    enabled: !!sessionId,
  })

  const displayAmount =
    metric === 'PENDING' ? summaryData?.totalPending || 0 : summaryData?.totalPaid || 0

  const formatINR = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(paise / 100)
  }

  return (
    <div className="p-4 bg-card rounded-xl border border-border shadow-sm flex flex-col h-full">
      <div className="flex flex-col gap-2 mb-4">
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as 'PENDING' | 'PAID')}
          className="w-full text-sm font-medium bg-transparent border-none outline-none focus:ring-0 p-0 text-muted-foreground"
        >
          <option value="PENDING">Pending Fees</option>
          <option value="PAID">Total Paid</option>
        </select>

        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-full h-8 text-xs rounded-md border border-input bg-transparent px-2"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={sessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="w-full h-8 text-xs rounded-md border border-input bg-transparent px-2"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-auto">
        {isLoading ? (
          <div className="text-xl font-bold text-muted-foreground animate-pulse">Loading...</div>
        ) : (
          <div
            className={`text-3xl font-bold ${metric === 'PENDING' ? 'text-red-600' : 'text-green-600'}`}
          >
            {formatINR(displayAmount)}
          </div>
        )}
      </div>
    </div>
  )
}
