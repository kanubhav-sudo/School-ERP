import React, { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import type { AttendanceStatus, AttendanceRecordItem, MarkAttendanceRecord } from '../api'

// ─── Types ────────────────────────────────────────────────────

export interface StudentRow {
  id: string
  firstName: string
  lastName: string
  admissionNumber: string
  rollNumber: string | null
}

interface AttendanceGridProps {
  students: StudentRow[]
  /** Pre-populated from a saved sheet; keyed by studentId */
  existingRecords?: AttendanceRecordItem[]
  onChange: (records: MarkAttendanceRecord[]) => void
}

// ─── Constants ────────────────────────────────────────────────

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'PRESENT', label: 'Present', color: 'bg-green-100 text-green-800' },
  { value: 'ABSENT', label: 'Absent', color: 'bg-red-100 text-red-800' },
  { value: 'LATE', label: 'Late', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'HALF_DAY', label: 'Half Day', color: 'bg-blue-100 text-blue-800' },
]

// ─── Helpers ──────────────────────────────────────────────────

function statusColor(status: AttendanceStatus): string {
  return STATUS_OPTIONS.find((o) => o.value === status)?.color ?? ''
}

// ─── Component ────────────────────────────────────────────────

export function AttendanceGrid({ students, existingRecords, onChange }: AttendanceGridProps) {
  // Build initial state from existing records; default new students to PRESENT
  const buildInitial = (): Record<string, MarkAttendanceRecord> => {
    const map: Record<string, MarkAttendanceRecord> = {}
    const recordsToUse = existingRecords || []
    for (const s of students) {
      const existing = recordsToUse.find((r) => r.student.id === s.id)
      map[s.id] = existing
        ? { studentId: s.id, status: existing.status, remarks: existing.remarks ?? '' }
        : { studentId: s.id, status: 'PRESENT', remarks: '' }
    }
    return map
  }

  const [records, setRecords] = useState<Record<string, MarkAttendanceRecord>>(buildInitial)

  // Re-initialise when students list or saved records change (e.g. date switch)
  useEffect(() => {
    const next = buildInitial()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecords(next)
    onChange(Object.values(next))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, existingRecords])

  const update = (studentId: string, patch: Partial<MarkAttendanceRecord>) => {
    setRecords((prev) => {
      const next = { ...prev, [studentId]: { ...prev[studentId], ...patch } }
      onChange(Object.values(next))
      return next
    })
  }

  const markAll = (status: AttendanceStatus) => {
    setRecords((prev) => {
      const next: Record<string, MarkAttendanceRecord> = {}
      for (const key of Object.keys(prev)) {
        next[key] = { ...prev[key], status }
      }
      onChange(Object.values(next))
      return next
    })
  }

  if (students.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border rounded-xl border-dashed">
        No students enrolled in this section.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Bulk Actions */}
      <div className="flex gap-2 items-center flex-wrap p-3 bg-card rounded-lg border border-border">
        <span className="text-sm font-medium text-muted-foreground mr-2">Mark all as:</span>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => markAll(opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-opacity hover:opacity-80 ${opt.color}`}
          >
            {opt.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{students.length} students</span>
      </div>

      {/* Student Rows */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-8">#</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-32">
                Admission
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-44">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.map((student, idx) => {
              const record = records[student.id]
              if (!record) return null
              return (
                <tr key={student.id} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {student.firstName} {student.lastName}
                    </div>
                    {student.rollNumber && (
                      <div className="text-xs text-muted-foreground">
                        Roll: {student.rollNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{student.admissionNumber}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${statusColor(record.status)} border-0 font-medium shrink-0`}
                      >
                        {STATUS_OPTIONS.find((o) => o.value === record.status)?.label}
                      </Badge>
                      <Select
                        value={record.status}
                        onValueChange={(val) =>
                          update(student.id, { status: val as AttendanceStatus })
                        }
                      >
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Textarea
                      value={record.remarks ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        update(student.id, { remarks: e.target.value })
                      }
                      placeholder="Optional remark…"
                      className="h-8 min-h-0 text-xs resize-none py-1"
                      rows={1}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
