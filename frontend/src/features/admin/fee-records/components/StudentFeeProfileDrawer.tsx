import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { fetchStudentFeeProfile, addFeePayment, type AddFeePaymentParams } from '../api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  X,
  Receipt,
  FileText,
  Calendar,
} from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  studentId: string
  studentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StudentFeeProfileDrawer({ studentId, studentName, open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [payMode, setPayMode] = useState<AddFeePaymentParams['paymentMode']>('CASH')
  const [payRemarks, setPayRemarks] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['student-fee-profile', studentId],
    queryFn: () => fetchStudentFeeProfile(studentId),
    enabled: open && !!studentId,
  })

  const payMutation = useMutation({
    mutationFn: (params: AddFeePaymentParams) => addFeePayment(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-fee-profile', studentId] })
      queryClient.invalidateQueries({ queryKey: ['student-fee-list'] })
      queryClient.invalidateQueries({ queryKey: ['fee-records'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
      setPayDialogOpen(false)
      resetPayForm()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Payment processing failed'
      setErrorMessage(msg)
    },
  })

  function resetPayForm() {
    setPayAmount('')
    setReceiptNumber('')
    setPaymentDate(format(new Date(), 'yyyy-MM-dd'))
    setPayMode('CASH')
    setPayRemarks('')
    setErrorMessage(null)
  }

  function handlePay(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)
    if (!payAmount || Number(payAmount) <= 0) {
      setErrorMessage('Please enter a valid positive payment amount')
      return
    }
    if (!receiptNumber.trim()) {
      setErrorMessage('Receipt Number is mandatory')
      return
    }

    payMutation.mutate({
      studentId,
      amount: Number(payAmount),
      receiptNumber: receiptNumber.trim(),
      paymentDate: paymentDate || undefined,
      paymentMode: payMode,
      remarks: payRemarks || undefined,
    })
  }

  const fmt = (paise: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
      (paise || 0) / 100
    )

  const summary = data?.summary
  const student = data?.student
  const records: any[] = data?.records || []
  const payments: any[] = data?.payments || []
  const timeline: any[] = data?.timeline || []

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">{studentName}</DialogTitle>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {student?.admissionNumber && (
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded mr-2">
                      {student.admissionNumber}
                    </span>
                  )}
                  {student?.className && `${student.className}`}
                  {student?.sectionName && ` (${student.sectionName})`}
                  {student?.sessionName && ` · ${student.sessionName}`}
                </div>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setErrorMessage(null)
                  setPayDialogOpen(true)
                }}
              >
                <CreditCard className="h-4 w-4 mr-1.5" />
                Receive Payment
              </Button>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              Loading student fee profile...
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              {/* Fee Structure Summary Header */}
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

              {/* Financial Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-card rounded-xl border border-border text-center">
                  <p className="text-xs text-muted-foreground font-medium">Total Fee (Current)</p>
                  <p className="text-lg font-bold mt-1 text-foreground">{fmt(summary?.totalFees || 0)}</p>
                </div>
                <div className="p-3.5 bg-card rounded-xl border border-border text-center">
                  <p className="text-xs text-muted-foreground font-medium">Paid Amount</p>
                  <p className="text-lg font-bold mt-1 text-emerald-600">{fmt(summary?.paidAmount || 0)}</p>
                </div>
                <div className="p-3.5 bg-card rounded-xl border border-border text-center">
                  <p className="text-xs text-muted-foreground font-medium">Pending Amount</p>
                  <p
                    className={`text-lg font-bold mt-1 ${
                      (summary?.pendingAmount || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {fmt(summary?.pendingAmount || 0)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {summary?.pendingFrom ? `From ${summary.pendingFrom}` : 'Cleared'}
                  </p>
                </div>
                <div className="p-3.5 bg-card rounded-xl border border-border text-center">
                  <p className="text-xs text-muted-foreground font-medium">Advance Balance</p>
                  <p className="text-lg font-bold mt-1 text-blue-600">
                    {fmt(summary?.advanceBalance || 0)}
                  </p>
                </div>
              </div>

              {/* 12-Month Academic Timeline */}
              <div>
                <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
                  Monthly Timeline (Apr → Mar)
                </h3>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                  {timeline.map((m) => (
                    <div
                      key={m.month}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center text-xs ${
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
              <div>
                <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                  Payment History & Receipts
                </h3>
                {payments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                    No payment transactions recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {payments.map((p: any) => (
                      <div
                        key={p.id}
                        className="flex flex-wrap items-center justify-between p-3 bg-card border rounded-lg text-sm gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-semibold">{fmt(p.amount)}</div>
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
                        <div className="text-right text-xs text-muted-foreground">
                          {format(new Date(p.paymentDate || p.createdAt), 'dd MMM yyyy')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receive Payment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Receive Fee Payment
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePay} className="space-y-4 py-2">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="p-3 bg-muted/60 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-foreground">{studentName}</div>
              <div className="text-muted-foreground">
                Current Pending:{' '}
                <span className="font-bold text-rose-600">{fmt(summary?.pendingAmount || 0)}</span>
                {summary?.pendingFrom && ` (From ${summary.pendingFrom})`}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="receipt-number" className="text-xs font-semibold">
                Receipt Number <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="receipt-number"
                placeholder="Enter unique receipt number (e.g. RCPT-2026-001)"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-amount" className="text-xs font-semibold">
                Amount (₹) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="pay-amount"
                type="number"
                min="1"
                step="1"
                placeholder="Enter payment amount"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pay-date" className="text-xs font-semibold">
                  Payment Date
                </Label>
                <Input
                  id="pay-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay-mode" className="text-xs font-semibold">
                  Payment Mode
                </Label>
                <Select value={payMode} onValueChange={(v: any) => setPayMode(v)}>
                  <SelectTrigger id="pay-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-remarks" className="text-xs font-semibold">
                Remarks (Optional)
              </Label>
              <Input
                id="pay-remarks"
                placeholder="Payment notes or remarks"
                value={payRemarks}
                onChange={(e) => setPayRemarks(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPayDialogOpen(false)
                  resetPayForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={payMutation.isPending || !payAmount || !receiptNumber}>
                {payMutation.isPending ? 'Processing...' : 'Collect Payment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
