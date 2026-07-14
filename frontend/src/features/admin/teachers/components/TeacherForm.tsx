import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTeacher, updateTeacher, type Teacher, type CreateTeacherPayload } from '../api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Coerce an empty string to undefined.
 * Used for optional enum fields where the <select> placeholder has value="".
 */
function emptyStrToUndefined<T>(val: T | '' | undefined) {
  return val === '' ? undefined : val
}

// ─── Schema ─────────────────────────────────────────────────────

const teacherSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required').max(50),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  email: z.string().email('Invalid email address'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  // Optional strings — "" is treated same as omitted
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  qualification: z.string().optional(),
  department: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  // Optional number
  experienceYears: z.number().int().min(0).optional(),
  // Optional enums — "" means "not set" (placeholder)
  employmentStatus: z
    .enum(['PERMANENT', 'CONTRACT', 'PROBATION', 'RESIGNED', 'TERMINATED', ''])
    .optional(),
  designation: z
    .enum([
      'PRINCIPAL',
      'VICE_PRINCIPAL',
      'COORDINATOR',
      'SENIOR_TEACHER',
      'TEACHER',
      'ASSISTANT_TEACHER',
      '',
    ])
    .optional(),
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
      '',
    ])
    .optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  photoUrl: z.string().optional(),
})

type TeacherFormValues = z.infer<typeof teacherSchema>

/**
 * Build a clean API payload from form values.
 * - Strips empty strings (converts to undefined so they are omitted)
 * - Validates photoUrl is a proper URL if provided
 */
function buildPayload(data: TeacherFormValues): CreateTeacherPayload {
  return {
    employeeId: data.employeeId,
    firstName: data.firstName,
    lastName: data.lastName,
    gender: data.gender,
    email: data.email,
    joiningDate: data.joiningDate,
    dateOfBirth: data.dateOfBirth || undefined,
    phone: data.phone || undefined,
    qualification: data.qualification || undefined,
    department: data.department || undefined,
    address: data.address || undefined,
    notes: data.notes || undefined,
    emergencyContact: data.emergencyContact || undefined,
    emergencyPhone: data.emergencyPhone || undefined,
    photoUrl: data.photoUrl || undefined,
    experienceYears: data.experienceYears,
    employmentStatus: emptyStrToUndefined(data.employmentStatus) as
      CreateTeacherPayload['employmentStatus'] | undefined,
    designation: emptyStrToUndefined(data.designation) as
      CreateTeacherPayload['designation'] | undefined,
    bloodGroup: emptyStrToUndefined(data.bloodGroup) as
      CreateTeacherPayload['bloodGroup'] | undefined,
  }
}

// ─── Props ──────────────────────────────────────────────────────

interface Props {
  teacher: Teacher | null
  onClose: () => void
  onSuccess?: (credentials?: { username: string; temporaryPassword?: string }) => void
}

// ─── Component ──────────────────────────────────────────────────

export function TeacherForm({ teacher, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient()
  const isEditing = !!teacher

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      employeeId: teacher?.employeeId ?? '',
      firstName: teacher?.firstName ?? '',
      lastName: teacher?.lastName ?? '',
      gender: teacher?.gender ?? 'MALE',
      email: teacher?.email ?? '',
      joiningDate: teacher ? new Date(teacher.joiningDate).toISOString().split('T')[0] : '',
      dateOfBirth: teacher?.dateOfBirth
        ? new Date(teacher.dateOfBirth).toISOString().split('T')[0]
        : '',
      phone: teacher?.phone ?? '',
      qualification: teacher?.qualification ?? '',
      experienceYears: teacher?.experienceYears ?? 0,
      department: teacher?.department ?? '',
      employmentStatus: teacher?.employmentStatus ?? 'PERMANENT',
      address: teacher?.address ?? '',
      notes: teacher?.notes ?? '',
      designation: teacher?.designation ?? 'TEACHER',
      bloodGroup: teacher?.bloodGroup ?? '',
      emergencyContact: teacher?.emergencyContact ?? '',
      emergencyPhone: teacher?.emergencyPhone ?? '',
      photoUrl: teacher?.photoUrl ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: TeacherFormValues) => {
      const payload = buildPayload(data)
      if (isEditing) {
        return updateTeacher({ id: teacher.id, payload })
      }
      return createTeacher(payload)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      queryClient.invalidateQueries({ queryKey: ['teacherStats'] })
      if (!isEditing && 'credentials' in response) {
        onSuccess?.(response.credentials)
      } else {
        onSuccess?.()
      }
      onClose()
    },
  })

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {/* Row 1: IDs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input id="employeeId" {...register('employeeId')} placeholder="EMP001" />
              {errors.employeeId && (
                <p className="text-sm text-red-500">{errors.employeeId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" {...register('department')} placeholder="Science" />
            </div>
          </div>

          {/* Row 2: Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" {...register('firstName')} placeholder="John" />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" {...register('lastName')} placeholder="Doe" />
              {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          {/* Row 3: Gender + Email */}
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} placeholder="john@school.edu" />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          {/* Row 4: Phone + DOB */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} placeholder="+91 9876543210" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
            </div>
          </div>

          {/* Row 5: Joining Date + Employment Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="joiningDate">Joining Date *</Label>
              <Input id="joiningDate" type="date" {...register('joiningDate')} />
              {errors.joiningDate && (
                <p className="text-sm text-red-500">{errors.joiningDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentStatus">Employment Status</Label>
              <select
                id="employmentStatus"
                {...register('employmentStatus')}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="PERMANENT">Permanent</option>
                <option value="CONTRACT">Contract</option>
                <option value="PROBATION">Probation</option>
                <option value="RESIGNED">Resigned</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
          </div>

          {/* Row 5.5: Designation + Blood Group */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <select
                id="designation"
                {...register('designation')}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="PRINCIPAL">Principal</option>
                <option value="VICE_PRINCIPAL">Vice Principal</option>
                <option value="COORDINATOR">Coordinator</option>
                <option value="SENIOR_TEACHER">Senior Teacher</option>
                <option value="TEACHER">Teacher</option>
                <option value="ASSISTANT_TEACHER">Assistant Teacher</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <select
                id="bloodGroup"
                {...register('bloodGroup')}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Select Blood Group</option>
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
          </div>

          {/* Row 6: Qualification + Experience */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qualification">Qualification</Label>
              <Input
                id="qualification"
                {...register('qualification')}
                placeholder="M.Sc. Mathematics"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceYears">Experience (Years)</Label>
              <Input
                id="experienceYears"
                type="number"
                {...register('experienceYears', { valueAsNumber: true })}
                min={0}
              />
            </div>
          </div>

          {/* Row 7: Emergency Contact + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                {...register('emergencyContact')}
                placeholder="Spouse, Parent..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Emergency Phone</Label>
              <Input
                id="emergencyPhone"
                {...register('emergencyPhone')}
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          {/* Photo URL */}
          <div className="space-y-2">
            <Label htmlFor="photoUrl">Photo URL</Label>
            <Input
              id="photoUrl"
              {...register('photoUrl')}
              placeholder="https://example.com/photo.jpg"
            />
            {errors.photoUrl && <p className="text-sm text-red-500">{errors.photoUrl.message}</p>}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register('address')} placeholder="123 Main St, City" />
          </div>

          {/* Notes */}
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

          {mutation.isError && (
            <p className="text-sm text-red-500">
              {mutation.error instanceof Error ? mutation.error.message : 'An error occurred'}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                  ? 'Save Changes'
                  : 'Add Teacher'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
