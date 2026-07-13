import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createStudent, updateStudent, fetchStudents, type Student } from '../api'
import { fetchSessions } from '@/features/admin/academic-sessions/api'
import { fetchClasses } from '@/features/admin/classes/api'
import { fetchSections } from '@/features/admin/sections/api'
import { fetchFeePlans, type FeePlan } from '@/features/admin/fee-plans/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useMemo } from 'react'

const studentSchema = z.object({
  admissionNumber: z.string().min(1, 'Admission number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  admissionDate: z.string().min(1, 'Admission date is required'),
  rollNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z
    .enum([
      'A_POSITIVE',
      'A_NEGATIVE',
      'B_POSITIVE',
      'B_NEGATIVE',
      'O_POSITIVE',
      'O_NEGATIVE',
      'AB_POSITIVE',
      'AB_NEGATIVE',
    ])
    .optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianRelation: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  address: z.string().optional(),
  sessionId: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  feePlanId: z.string().optional(),
  siblingStudentId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'EXPELLED']).optional(),
  notes: z.string().optional(),
})

type StudentFormValues = z.infer<typeof studentSchema>

interface Props {
  student: Student | null
  onClose: () => void
  onSuccess?: (credentials?: { username: string; temporaryPassword?: string }) => void
}

/** Format paise to ₹ */
function formatINR(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100)
}

export function StudentForm({ student, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient()
  const isEditing = !!student

  const [siblingSearch, setSiblingSearch] = useState('')

  const { data: sessions = [] } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: fetchSessions,
  })
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })
  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: fetchSections,
  })

  // Fetch all fee plans (no pagination needed for dropdown)
  const { data: feePlanData } = useQuery({
    queryKey: ['fee-plans', { limit: 100 }],
    queryFn: () => fetchFeePlans({ limit: 100 }),
  })
  const allFeePlans: FeePlan[] = useMemo(() => feePlanData?.feePlans ?? [], [feePlanData])

  // Fetch students for sibling search (only when sibling search is active)
  const { data: siblingData } = useQuery({
    queryKey: ['students', { search: siblingSearch, limit: 20 }],
    queryFn: () => fetchStudents({ search: siblingSearch, limit: 20 }),
    enabled: siblingSearch.length >= 2,
  })
  const siblingOptions = useMemo(() => siblingData?.students ?? [], [siblingData])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      admissionNumber: student?.admissionNumber ?? '',
      firstName: student?.firstName ?? '',
      lastName: student?.lastName ?? '',
      gender: student?.gender ?? 'MALE',
      admissionDate: student ? new Date(student.admissionDate).toISOString().split('T')[0] : '',
      rollNumber: student?.rollNumber ?? '',
      dateOfBirth: student?.dateOfBirth
        ? new Date(student.dateOfBirth).toISOString().split('T')[0]
        : '',
      bloodGroup: student?.bloodGroup ?? undefined,
      phone: student?.phone ?? '',
      email: student?.email ?? '',
      fatherName: student?.fatherName ?? '',
      fatherPhone: student?.fatherPhone ?? '',
      motherName: student?.motherName ?? '',
      motherPhone: student?.motherPhone ?? '',
      guardianName: student?.guardianName ?? '',
      guardianPhone: student?.guardianPhone ?? '',
      guardianRelation: student?.guardianRelation ?? '',
      emergencyContact: student?.emergencyContact ?? '',
      emergencyPhone: student?.emergencyPhone ?? '',
      address: student?.address ?? '',
      sessionId: student?.sessionId ?? '',
      classId: student?.classId ?? '',
      sectionId: student?.sectionId ?? '',
      feePlanId: student?.feePlanId ?? '',
      siblingStudentId: student?.siblingStudentId ?? '',
      status: student?.status ?? 'ACTIVE',
      notes: student?.notes ?? '',
    },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchSessionId = watch('sessionId')
  const watchClassId = watch('classId')
  const watchFeePlanId = watch('feePlanId')
  const watchSiblingId = watch('siblingStudentId')

  // Filter fee plans by selected session and class
  const filteredFeePlans = useMemo(() => {
    return allFeePlans.filter((fp) => {
      if (!fp.isActive) return false
      if (watchSessionId && fp.sessionId !== watchSessionId) return false
      if (watchClassId && fp.classId !== watchClassId) return false
      return true
    })
  }, [allFeePlans, watchSessionId, watchClassId])

  // Get selected fee plan details for preview
  const selectedPlan = useMemo(() => {
    if (!watchFeePlanId) return null
    return allFeePlans.find((fp) => fp.id === watchFeePlanId) ?? null
  }, [allFeePlans, watchFeePlanId])

  // Calculate fee preview
  const feePreview = useMemo(() => {
    if (!selectedPlan) return null
    const monthly = selectedPlan.monthlyAmount
    const discountPaise =
      selectedPlan.discountAmount + Math.round((monthly * selectedPlan.discountPercent) / 100)
    const net = Math.max(0, monthly - discountPaise)
    return { monthly, discount: discountPaise, net }
  }, [selectedPlan])

  // Get selected sibling display name
  const selectedSiblingName = useMemo(() => {
    if (!watchSiblingId) return null
    const found = siblingOptions.find((s) => s.id === watchSiblingId)
    if (found) return `${found.firstName} ${found.lastName} (${found.admissionNumber})`
    // If editing and sibling was previously set but not in current search results
    return watchSiblingId ? 'Previously assigned sibling' : null
  }, [watchSiblingId, siblingOptions])

  const mutation = useMutation({
    mutationFn: (data: StudentFormValues) => {
      // Convert empty strings to undefined for optional FK fields
      const cleaned = {
        ...data,
        sessionId: data.sessionId || undefined,
        classId: data.classId || undefined,
        sectionId: data.sectionId || undefined,
        feePlanId: data.feePlanId || undefined,
        siblingStudentId: data.siblingStudentId || undefined,
        email: data.email || undefined,
        bloodGroup: data.bloodGroup || undefined,
      }
      if (isEditing) {
        return updateStudent({ id: student.id, payload: cleaned })
      }
      return createStudent(cleaned)
    },
    onSuccess: (response: Student | import('../api').CreateStudentResponse) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      if (!isEditing && response && 'credentials' in response) {
        onSuccess?.(response.credentials)
      } else {
        onSuccess?.()
      }
      onClose()
    },
  })

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Student' : 'New Admission'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
          {/* ── Basic Info ── */}
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">
              Basic Information
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admissionNumber">Admission Number *</Label>
                <Input
                  id="admissionNumber"
                  {...register('admissionNumber')}
                  placeholder="ADM2024001"
                />
                {errors.admissionNumber && (
                  <p className="text-sm text-red-500">{errors.admissionNumber.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number</Label>
                <Input id="rollNumber" {...register('rollNumber')} placeholder="01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" {...register('firstName')} placeholder="Jane" />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" {...register('lastName')} placeholder="Doe" />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <select
                  id="gender"
                  {...register('gender')}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <select
                  id="bloodGroup"
                  {...register('bloodGroup')}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">— Select —</option>
                  <option value="A_POSITIVE">A+</option>
                  <option value="A_NEGATIVE">A-</option>
                  <option value="B_POSITIVE">B+</option>
                  <option value="B_NEGATIVE">B-</option>
                  <option value="O_POSITIVE">O+</option>
                  <option value="O_NEGATIVE">O-</option>
                  <option value="AB_POSITIVE">AB+</option>
                  <option value="AB_NEGATIVE">AB-</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register('phone')} placeholder="+91 9876543210" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="student@school.edu"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>
            </div>
          </div>

          {/* ── Parent Info ── */}
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">
              Parent Information
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fatherName">Father's Name</Label>
                <Input id="fatherName" {...register('fatherName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fatherPhone">Father's Phone</Label>
                <Input id="fatherPhone" {...register('fatherPhone')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motherName">Mother's Name</Label>
                <Input id="motherName" {...register('motherName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motherPhone">Mother's Phone</Label>
                <Input id="motherPhone" {...register('motherPhone')} />
              </div>
            </div>
          </div>

          {/* ── Guardian + Emergency ── */}
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">
              Guardian &amp; Emergency Contact
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guardianName">Guardian Name</Label>
                <Input id="guardianName" {...register('guardianName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianPhone">Guardian Phone</Label>
                <Input id="guardianPhone" {...register('guardianPhone')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianRelation">Relation</Label>
                <Input
                  id="guardianRelation"
                  {...register('guardianRelation')}
                  placeholder="Uncle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                <Input id="emergencyPhone" {...register('emergencyPhone')} />
              </div>
            </div>
          </div>

          {/* ── Academic Assignment ── */}
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">
              Academic Assignment
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admissionDate">Admission Date *</Label>
                <Input id="admissionDate" type="date" {...register('admissionDate')} />
                {errors.admissionDate && (
                  <p className="text-sm text-red-500">{errors.admissionDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  {...register('status')}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="TRANSFERRED">Transferred</option>
                  <option value="GRADUATED">Graduated</option>
                  <option value="EXPELLED">Expelled</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionId">Academic Session</Label>
                <select
                  id="sessionId"
                  {...register('sessionId')}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">— Select Session —</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="classId">Class</Label>
                <select
                  id="classId"
                  {...register('classId')}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">— Select Class —</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="sectionId">Section</Label>
                <select
                  id="sectionId"
                  {...register('sectionId')}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">— Select Section —</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Fee & Finance ── */}
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">
              Fee &amp; Finance
            </p>
            <div className="grid grid-cols-2 gap-4">
              {/* Fee Plan Dropdown — filtered by session + class */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="feePlanId">Fee Plan</Label>
                <select
                  id="feePlanId"
                  {...register('feePlanId')}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">— No Fee Plan —</option>
                  {filteredFeePlans.map((fp) => (
                    <option key={fp.id} value={fp.id}>
                      {fp.name} ({fp.type === 'SIBLING_DISCOUNT' ? 'Sibling Discount' : 'Standard'})
                      — {formatINR(fp.monthlyAmount)}
                    </option>
                  ))}
                </select>
                {filteredFeePlans.length === 0 && watchSessionId && watchClassId && (
                  <p className="text-xs text-amber-600">
                    No fee plans configured for the selected session and class. Create one in Fee
                    Plans first.
                  </p>
                )}
              </div>

              {/* Sibling Student — shown when plan type is SIBLING_DISCOUNT */}
              {selectedPlan?.type === 'SIBLING_DISCOUNT' && (
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="siblingSearch">Sibling Student</Label>
                  <div className="space-y-2">
                    <Input
                      id="siblingSearch"
                      placeholder="Search by name or admission number..."
                      value={siblingSearch}
                      onChange={(e) => setSiblingSearch(e.target.value)}
                    />
                    {/* Sibling search results */}
                    {siblingSearch.length >= 2 && siblingOptions.length > 0 && (
                      <div className="border rounded-md max-h-40 overflow-y-auto divide-y">
                        {siblingOptions
                          .filter((s) => s.id !== student?.id) // Prevent self-selection
                          .map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                                watchSiblingId === s.id
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : ''
                              }`}
                              onClick={() => {
                                setValue('siblingStudentId', s.id)
                                setSiblingSearch('')
                              }}
                            >
                              {s.firstName} {s.lastName}{' '}
                              <span className="text-muted-foreground">({s.admissionNumber})</span>
                            </button>
                          ))}
                      </div>
                    )}
                    {siblingSearch.length >= 2 &&
                      siblingOptions.filter((s) => s.id !== student?.id).length === 0 && (
                        <p className="text-xs text-muted-foreground">No students found.</p>
                      )}

                    {/* Display selected sibling */}
                    {watchSiblingId && (
                      <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2 text-sm">
                        <span>{selectedSiblingName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setValue('siblingStudentId', '')}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Fee Preview ── */}
            {feePreview && (
              <div className="mt-4 rounded-lg border bg-muted/50 p-4 space-y-1">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Fee Preview
                </p>
                <div className="flex justify-between text-sm">
                  <span>Monthly Fee</span>
                  <span className="font-medium">{formatINR(feePreview.monthly)}</span>
                </div>
                {feePreview.discount > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Discount</span>
                    <span>− {formatINR(feePreview.discount)}</span>
                  </div>
                )}
                <div className="border-t pt-1 mt-1 flex justify-between text-sm font-semibold">
                  <span>Final Payable Fee</span>
                  <span className="text-primary">{formatINR(feePreview.net)}</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Address + Notes ── */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register('address')} placeholder="123 Main St, City" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                placeholder="Any additional information..."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm resize-none"
              />
            </div>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-500">
              {mutation.error instanceof Error ? mutation.error.message : 'An error occurred'}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {isEditing ? 'Save Changes' : 'Add Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
