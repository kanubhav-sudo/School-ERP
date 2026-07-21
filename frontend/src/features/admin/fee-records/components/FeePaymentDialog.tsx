import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addFeePayment, type AddFeePaymentParams } from '../api'

interface FeePaymentDialogProps {
  studentId: string
  studentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeePaymentDialog({
  studentId,
  studentName,
  open,
  onOpenChange,
}: FeePaymentDialogProps) {
  const [amount, setAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState<AddFeePaymentParams['paymentMode']>('CASH')
  const [transactionId, setTransactionId] = useState('')
  const [remarks, setRemarks] = useState('')

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: AddFeePaymentParams) => addFeePayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-records'] })
      queryClient.invalidateQueries({ queryKey: ['fee-summary'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
      onOpenChange(false)
      // Reset form
      setAmount('')
      setPaymentMode('CASH')
      setTransactionId('')
      setRemarks('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return

    mutation.mutate({
      studentId,
      amount: Number(amount),
      paymentMode,
      transactionId: transactionId || undefined,
      remarks: remarks || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receive Fee for {studentName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMode">Payment Mode</Label>
            <Select
              value={paymentMode}
              onValueChange={(val: any) => setPaymentMode(val)}
            >
              <SelectTrigger id="paymentMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(paymentMode !== 'CASH') && (
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction / Reference ID</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Input
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Processing...' : 'Receive Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
