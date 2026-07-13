import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetchFeePlans, deleteFeePlan, type FeePlan, type FeePlanFilters } from './api'
import { fetchSessions } from '@/features/admin/academic-sessions/api'
import { FeePlanForm } from './components/FeePlanForm'

const FEE_TYPE_LABELS: Record<string, string> = {
  STANDARD_MONTHLY: 'Standard Monthly',
  SIBLING_DISCOUNT: 'Sibling Discount',
}

const FEE_TYPE_COLORS: Record<string, string> = {
  STANDARD_MONTHLY: 'bg-blue-100 text-blue-700',
  SIBLING_DISCOUNT: 'bg-purple-100 text-purple-700',
}

/** Format paise to ₹ display */
function formatINR(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100)
}

export function FeePlansPage() {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<FeePlan | null>(null)
  const [filters, setFilters] = useState<FeePlanFilters>({
    page: 1,
    limit: 20,
  })

  // Fetch sessions for filter dropdown
  const { data: sessions = [] } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: fetchSessions,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['fee-plans', filters],
    queryFn: () => fetchFeePlans(filters),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFeePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] })
    },
  })

  const feePlans = data?.feePlans ?? []
  const pagination = data?.pagination

  const handleCreate = () => {
    setEditingPlan(null)
    setIsFormOpen(true)
  }

  const handleEdit = (plan: FeePlan) => {
    setEditingPlan(plan)
    setIsFormOpen(true)
  }

  const handleDelete = (plan: FeePlan) => {
    if (
      confirm(`Delete fee plan "${plan.name}"? This cannot be undone if no students are assigned.`)
    ) {
      deleteMutation.mutate(plan.id)
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure monthly fee structures for each class and academic session.
          </p>
        </div>
        <Button onClick={handleCreate}>Add Fee Plan</Button>
      </div>

      {/* Session Filter */}
      <div className="flex gap-3">
        <select
          value={filters.sessionId ?? ''}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              sessionId: e.target.value || undefined,
              page: 1,
            }))
          }
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">All Sessions</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {filters.sessionId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                sessionId: undefined,
                page: 1,
              }))
            }
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
              <TableHead>Plan Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="text-right">Monthly Fee</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Net Fee</TableHead>
              <TableHead className="text-center">Students</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feePlans.map((plan) => {
              const discountPaise =
                plan.discountAmount + Math.round((plan.monthlyAmount * plan.discountPercent) / 100)
              const netPaise = Math.max(0, plan.monthlyAmount - discountPaise)

              return (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        FEE_TYPE_COLORS[plan.type] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {FEE_TYPE_LABELS[plan.type] ?? plan.type}
                    </span>
                  </TableCell>
                  <TableCell>{plan.session.name}</TableCell>
                  <TableCell>{plan.class.name}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatINR(plan.monthlyAmount)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-orange-600">
                    {discountPaise > 0 ? `− ${formatINR(discountPaise)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-primary">
                    {formatINR(netPaise)}
                  </TableCell>
                  <TableCell className="text-center">{plan._count.students}</TableCell>
                  <TableCell>
                    {plan.isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(plan)}>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(plan)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
            {feePlans.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  No fee plans found. Click "Add Fee Plan" to create one.
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
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: (prev.page ?? 1) - 1,
                }))
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: (prev.page ?? 1) + 1,
                }))
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      {isFormOpen && <FeePlanForm feePlan={editingPlan} onClose={() => setIsFormOpen(false)} />}
    </div>
  )
}
