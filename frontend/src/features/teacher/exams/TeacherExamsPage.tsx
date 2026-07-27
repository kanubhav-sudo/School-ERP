/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  fetchExams,
  fetchAdmitCardStudents,
  updateAdmitCardStatus,
  fetchSubjectMarks,
  saveSubjectMarks,
  fetchStudentMarks,
  saveStudentMarks,
} from '@/features/admin/exams/api'
import { fetchMyClasses } from '@/features/teacher/teacher-portal.api'
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
import { Calendar, Save, FileCheck, Edit3, UserCheck } from 'lucide-react'

function getDayFromDateString(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { weekday: 'long' })
}

export function TeacherExamsPage() {
  // Common Entry State
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')

  // Main Module Toggle: Admit Card | Result
  const [mainModule, setMainModule] = useState<'ADMIT_CARD' | 'RESULT'>('ADMIT_CARD')

  // Admit Card Inner Toggle: Exam Table | Students
  const [admitCardTab, setAdmitCardTab] = useState<'EXAM_TABLE' | 'STUDENTS'>('EXAM_TABLE')

  // Result Inner Toggle: Subjects | Students
  const [resultTab, setResultTab] = useState<'SUBJECTS' | 'STUDENTS'>('SUBJECTS')

  // Subject Marks State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [maxMarks, setMaxMarks] = useState<number>(100)
  const [studentMarksRows, setStudentMarksRows] = useState<
    Array<{
      studentId: string
      firstName: string
      lastName: string
      admissionNumber: string
      obtainedMarks: number
      remarks?: string
    }>
  >([])

  // Single Student Marks State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [singleStudentMarks, setSingleStudentMarks] = useState<any>(null)

  // Fetch Teacher's Assigned Classes directly from backend API
  const { data: myClasses = [] } = useQuery({
    queryKey: ['teacher-my-classes'],
    queryFn: fetchMyClasses,
  })

  // ── Derive assigned Sessions, Classes, Sections, and Subjects ──────────────

  // Derive unique sessions assigned to teacher directly from myClasses (No admin API needed)
  const assignedSessions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    myClasses.forEach((mc) => {
      if (mc.sessionId && mc.sessionName && !map.has(mc.sessionId)) {
        map.set(mc.sessionId, { id: mc.sessionId, name: mc.sessionName })
      }
    })
    return Array.from(map.values())
  }, [myClasses])

  const effectiveSessionId = selectedSessionId || assignedSessions[0]?.id || ''

  // Derive unique classes assigned for the effective session
  const uniqueClasses = useMemo(() => {
    const map = new Map<string, { classId: string; className: string }>()
    myClasses
      .filter((mc) => mc.sessionId === effectiveSessionId)
      .forEach((mc) => {
        if (!map.has(mc.classId)) {
          map.set(mc.classId, { classId: mc.classId, className: mc.className })
        }
      })
    return Array.from(map.values())
  }, [myClasses, effectiveSessionId])

  const effectiveClassId = selectedClassId || uniqueClasses[0]?.classId || ''

  // Derive unique sections assigned for the effective session & class
  const uniqueSections = useMemo(() => {
    const map = new Map<string, { sectionId: string; sectionName: string }>()
    myClasses
      .filter((mc) => mc.sessionId === effectiveSessionId && mc.classId === effectiveClassId)
      .forEach((mc) => {
        if (!map.has(mc.sectionId)) {
          map.set(mc.sectionId, { sectionId: mc.sectionId, sectionName: mc.sectionName })
        }
      })
    return Array.from(map.values())
  }, [myClasses, effectiveSessionId, effectiveClassId])

  const effectiveSectionId = selectedSectionId || uniqueSections[0]?.sectionId || ''

  // Derive assigned subjects for effective session, class, and section
  const assignedSubjects = useMemo(() => {
    const map = new Map<string, { id: string; name: string; code: string }>()
    myClasses
      .filter(
        (mc) =>
          mc.sessionId === effectiveSessionId &&
          mc.classId === effectiveClassId &&
          (!effectiveSectionId || mc.sectionId === effectiveSectionId)
      )
      .forEach((mc) => {
        mc.subjects?.forEach((sub) => {
          if (!map.has(sub.id)) {
            map.set(sub.id, sub)
          }
        })
      })
    return Array.from(map.values())
  }, [myClasses, effectiveSessionId, effectiveClassId, effectiveSectionId])

  // Handlers for cascading dropdown resets
  const handleSessionChange = (sessionId: string | null) => {
    if (!sessionId) return
    setSelectedSessionId(sessionId)
    setSelectedClassId('')
    setSelectedSectionId('')
    setSelectedSubjectId('')
  }

  const handleClassChange = (classId: string | null) => {
    if (!classId) return
    setSelectedClassId(classId)
    setSelectedSectionId('')
    setSelectedSubjectId('')
  }

  const handleSectionChange = (sectionId: string | null) => {
    if (!sectionId) return
    setSelectedSectionId(sectionId)
    setSelectedSubjectId('')
  }

  // ── Queries ──────────────────────────────────────────────────────────────────

  // Fetch Exams for selected Session & Class
  const { data: exams = [] } = useQuery({
    queryKey: ['teacher-exams', effectiveSessionId, effectiveClassId],
    queryFn: () =>
      fetchExams({
        sessionId: effectiveSessionId || undefined,
        classId: effectiveClassId || undefined,
      }),
    enabled: !!effectiveSessionId && !!effectiveClassId,
  })

  const currentExam = exams[0] || null

  // Fetch Admit Card Students (filtered by section if selected)
  const { data: rawAdmitCardStudents = [], refetch: refetchAdmitCardStudents } = useQuery({
    queryKey: ['teacher-admit-card-students', effectiveSessionId, effectiveClassId, currentExam?.id],
    queryFn: () =>
      fetchAdmitCardStudents(effectiveSessionId, effectiveClassId, currentExam?.id),
    enabled: !!effectiveSessionId && !!effectiveClassId,
  })

  const admitCardStudents = useMemo(() => {
    if (!effectiveSectionId) return rawAdmitCardStudents
    return rawAdmitCardStudents.filter((st: any) => st.sectionId === effectiveSectionId || !st.sectionId)
  }, [rawAdmitCardStudents, effectiveSectionId])

  // Fetch Subject Marks
  const effectiveSubjectId = selectedSubjectId || assignedSubjects[0]?.id || ''
  const { data: subjectMarksData, refetch: refetchSubjectMarks } = useQuery({
    queryKey: ['subject-marks', currentExam?.id, effectiveSubjectId],
    queryFn: () => fetchSubjectMarks(currentExam!.id, effectiveSubjectId),
    enabled: !!currentExam?.id && !!effectiveSubjectId && mainModule === 'RESULT' && resultTab === 'SUBJECTS',
  })

  const [prevSubjectMarksData, setPrevSubjectMarksData] = useState(subjectMarksData)
  if (subjectMarksData !== prevSubjectMarksData) {
    setPrevSubjectMarksData(subjectMarksData)
    if (subjectMarksData) {
      setMaxMarks(subjectMarksData.maxMarks || 100)
      setStudentMarksRows(subjectMarksData.students || [])
    }
  }

  // Save Subject Marks Mutation
  const saveSubjectMarksMutation = useMutation({
    mutationFn: () =>
      saveSubjectMarks(currentExam!.id, effectiveSubjectId, {
        maxMarks,
        marks: studentMarksRows.map((r) => ({
          studentId: r.studentId,
          obtainedMarks: Number(r.obtainedMarks) || 0,
          remarks: r.remarks,
        })),
      }),
    onSuccess: () => {
      alert('Subject marks saved successfully!')
      refetchSubjectMarks()
    },
  })

  // Fetch Single Student Marks
  const handleOpenStudentMarks = async (studentId: string) => {
    if (!currentExam?.id) return
    setSelectedStudentId(studentId)
    const data = await fetchStudentMarks(currentExam.id, studentId)
    setSingleStudentMarks(data)
  }

  // Save Single Student Marks Mutation
  const saveStudentMarksMutation = useMutation({
    mutationFn: () =>
      saveStudentMarks(currentExam!.id, selectedStudentId, singleStudentMarks.subjects.map((s: any) => ({
        subjectId: s.subjectId,
        maxMarks: Number(s.maxMarks) || 100,
        obtainedMarks: Number(s.obtainedMarks) || 0,
        remarks: s.remarks,
      }))),
    onSuccess: () => {
      alert('Student marks updated successfully!')
      handleOpenStudentMarks(selectedStudentId)
    },
  })

  // Teacher Recommend Admit Card Release Mutation
  const recommendAdmitCardMutation = useMutation({
    mutationFn: updateAdmitCardStatus,
    onSuccess: () => {
      refetchAdmitCardStudents()
    },
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exams &amp; Marks Entry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Teacher evaluation interface: View timetables, recommend admit cards, and enter subject marks.
        </p>
      </div>

      {/* COMMON ENTRY: Session → Class → Section (Teacher's assigned only) */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-wrap items-center gap-4">
        {/* 1. Academic Session */}
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Academic Session
          </Label>
          <Select value={effectiveSessionId} onValueChange={handleSessionChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select Session" />
            </SelectTrigger>
            <SelectContent>
              {assignedSessions.length > 0 ? (
                assignedSessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  No sessions assigned
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* 2. Class */}
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Class
          </Label>
          <Select value={effectiveClassId} onValueChange={handleClassChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              {uniqueClasses.length > 0 ? (
                uniqueClasses.map((c) => (
                  <SelectItem key={c.classId} value={c.classId}>
                    Class {c.className}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  No classes assigned
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* 3. Section */}
        <div className="space-y-1.5 flex-1 min-w-[180px]">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Section
          </Label>
          <Select value={effectiveSectionId} onValueChange={handleSectionChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select Section" />
            </SelectTrigger>
            <SelectContent>
              {uniqueSections.length > 0 ? (
                uniqueSections.map((sec) => (
                  <SelectItem key={sec.sectionId} value={sec.sectionId}>
                    Section {sec.sectionName}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  No sections assigned
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* MAIN TOGGLE: Admit Card | Result */}
      <div className="flex border-b border-border">
        <button
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            mainModule === 'ADMIT_CARD'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setMainModule('ADMIT_CARD')}
        >
          Admit Card
        </button>
        <button
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            mainModule === 'RESULT'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setMainModule('RESULT')}
        >
          Result
        </button>
      </div>

      {/* ADMIT CARD VIEW */}
      {mainModule === 'ADMIT_CARD' && (
        <div className="space-y-6">
          <div className="flex gap-2">
            <Button
              variant={admitCardTab === 'EXAM_TABLE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAdmitCardTab('EXAM_TABLE')}
            >
              <Calendar className="h-4 w-4 mr-1.5" />
              Exam Table
            </Button>
            <Button
              variant={admitCardTab === 'STUDENTS' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAdmitCardTab('STUDENTS')}
            >
              <FileCheck className="h-4 w-4 mr-1.5" />
              Students
            </Button>
          </div>

          {/* EXAM TABLE (TEACHER: READ ONLY DATE & TIME) */}
          {admitCardTab === 'EXAM_TABLE' && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground border border-border">
                Note: Date and Time are set by Admin and cannot be modified by Teachers.
              </div>

              {currentExam && (
                <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground bg-muted/40 px-4 py-2 rounded-lg border border-border">
                  <span>Exam:</span>
                  <span className="text-foreground">{currentExam.name}</span>
                </div>
              )}

              <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/60 border-b">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Day</th>
                      <th className="px-4 py-3 font-semibold">Time</th>
                      <th className="px-4 py-3 font-semibold">Subject</th>
                      <th className="px-4 py-3 font-semibold">Room / Hall</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {!currentExam?.schedules || currentExam.schedules.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No timetable schedules configured by Admin for this Class yet.
                        </td>
                      </tr>
                    ) : (
                      currentExam.schedules.map((sched: any) => (
                        <tr key={sched.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-medium">
                            {sched.examDate ? sched.examDate.slice(0, 10) : 'TBA'}
                          </td>
                          <td className="px-4 py-3 font-semibold text-primary">
                            {getDayFromDateString(sched.examDate)}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {sched.startTime} - {sched.endTime}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {sched.subject?.name || 'Subject'} ({sched.subject?.code})
                          </td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">
                            {sched.room || 'Main Hall'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STUDENTS (TEACHER RECOMMENDATION) */}
          {admitCardTab === 'STUDENTS' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300 rounded-lg text-xs">
                Teacher recommendation can always be overridden by Admin. Admin remains the final releasing authority.
              </div>

              <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/60 border-b">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Student Name</th>
                      <th className="px-4 py-3 font-semibold">Admission No</th>
                      <th className="px-4 py-3 font-semibold">Fee Status</th>
                      <th className="px-4 py-3 font-semibold">Teacher Recommendation</th>
                      <th className="px-4 py-3 font-semibold">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {admitCardStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No students found in selected Section.
                        </td>
                      </tr>
                    ) : (
                      admitCardStudents.map((st: any) => (
                        <tr key={st.studentId} className="hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-3 font-semibold">{st.firstName} {st.lastName}</td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {st.admissionNumber}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={
                                st.feeStatus === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-rose-50 text-rose-700 border-rose-300'
                              }
                            >
                              {st.feeStatus}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              className="h-8 rounded-md border text-xs font-semibold px-2 bg-background cursor-pointer"
                              value={st.teacherStatus === 'HOLD' ? 'HOLD' : 'RELEASED'}
                              onChange={(e) => {
                                const newStatus = e.target.value as 'RELEASED' | 'HOLD'
                                recommendAdmitCardMutation.mutate({
                                  sessionId: effectiveSessionId,
                                  examId: currentExam?.id,
                                  studentId: st.studentId,
                                  status: newStatus,
                                  role: 'TEACHER',
                                })
                              }}
                            >
                              <option value="RELEASED">Recommend Release</option>
                              <option value="HOLD">Hold</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {st.remark}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESULT VIEW */}
      {mainModule === 'RESULT' && (
        <div className="space-y-6">
          <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground border border-border">
            Note: Teachers manage student marks. Teacher CANNOT publish or release final results.
          </div>

          {/* Inner Toggle: Subjects | Students */}
          <div className="flex gap-2">
            <Button
              variant={resultTab === 'SUBJECTS' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setResultTab('SUBJECTS')}
            >
              <Edit3 className="h-4 w-4 mr-1.5" />
              Subjects
            </Button>
            <Button
              variant={resultTab === 'STUDENTS' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setResultTab('STUDENTS')}
            >
              <UserCheck className="h-4 w-4 mr-1.5" />
              Students
            </Button>
          </div>

          {/* SUBJECTS VIEW (TEACHER) */}
          {resultTab === 'SUBJECTS' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border border-border">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Select Assigned Subject</Label>
                    <Select
                      value={effectiveSubjectId}
                      onValueChange={(val) => setSelectedSubjectId(val ?? '')}
                    >
                      <SelectTrigger className="h-9 min-w-[220px]">
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignedSubjects.length > 0 ? (
                          assignedSubjects.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>
                              {sub.name} ({sub.code})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No subjects assigned
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Maximum Marks</Label>
                    <Input
                      type="number"
                      className="h-9 w-32 font-bold font-mono"
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {effectiveSubjectId && (
                  <Button
                    size="sm"
                    onClick={() => saveSubjectMarksMutation.mutate()}
                    disabled={saveSubjectMarksMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-1.5" /> Save Marks
                  </Button>
                )}
              </div>

              {effectiveSubjectId ? (
                <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/60 border-b">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Student Name</th>
                        <th className="px-4 py-3 font-semibold">Admission No</th>
                        <th className="px-4 py-3 font-semibold">Maximum Marks</th>
                        <th className="px-4 py-3 font-semibold">Marks Obtained</th>
                        <th className="px-4 py-3 font-semibold">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {studentMarksRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                            No students found for this subject.
                          </td>
                        </tr>
                      ) : (
                        studentMarksRows.map((row, idx) => (
                          <tr key={row.studentId} className="hover:bg-muted/40">
                            <td className="px-4 py-3 font-semibold">
                              {row.firstName} {row.lastName}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                              {row.admissionNumber}
                            </td>
                            <td className="px-4 py-3 font-mono font-semibold text-muted-foreground">
                              {maxMarks}
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                className="h-8 w-28 font-bold font-mono text-emerald-600"
                                value={row.obtainedMarks}
                                onChange={(e) => {
                                  const updated = [...studentMarksRows]
                                  updated[idx].obtainedMarks = Number(e.target.value) || 0
                                  setStudentMarksRows(updated)
                                }}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                className="h-8 text-xs"
                                placeholder="Optional remarks"
                                value={row.remarks || ''}
                                onChange={(e) => {
                                  const updated = [...studentMarksRows]
                                  updated[idx].remarks = e.target.value
                                  setStudentMarksRows(updated)
                                }}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground border rounded-xl border-dashed">
                  Please select a subject to enter student marks.
                </div>
              )}
            </div>
          )}

          {/* STUDENTS VIEW (TEACHER SINGLE STUDENT MARKS EVALUATION) */}
          {resultTab === 'STUDENTS' && (
            <div className="space-y-4">
              {/* Student Selector */}
              {!singleStudentMarks && (
                <div className="p-4 bg-muted/40 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground mb-3 font-semibold">Select a student to view / edit their marks:</p>
                  <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/60 border-b">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Student Name</th>
                          <th className="px-4 py-3 font-semibold">Admission No</th>
                          <th className="px-4 py-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {admitCardStudents.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                              No students found in selected section.
                            </td>
                          </tr>
                        ) : (
                          admitCardStudents.map((st: any) => (
                            <tr key={st.studentId} className="hover:bg-muted/40">
                              <td className="px-4 py-3 font-semibold">{st.firstName} {st.lastName}</td>
                              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{st.admissionNumber}</td>
                              <td className="px-4 py-3 text-right">
                                <Button size="sm" variant="outline" onClick={() => handleOpenStudentMarks(st.studentId)}>
                                  <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit Marks
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {singleStudentMarks ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
                    <div>
                      <h3 className="font-bold text-lg">{singleStudentMarks.student.firstName} {singleStudentMarks.student.lastName}</h3>
                      <p className="text-xs text-muted-foreground">
                        Admission: {singleStudentMarks.student.admissionNumber} · Class: {singleStudentMarks.student.className}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right font-mono">
                        <div className="text-xs text-muted-foreground">Overall Percentage</div>
                        <div className="text-lg font-bold text-emerald-600">
                          {singleStudentMarks.overallPercentage}%
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSingleStudentMarks(null)}
                      >
                        ← Back
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveStudentMarksMutation.mutate()}
                        disabled={saveStudentMarksMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-1.5" /> Save Student Marks
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/60 border-b">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Subject</th>
                          <th className="px-4 py-3 font-semibold text-center">Max Marks</th>
                          <th className="px-4 py-3 font-semibold text-center">Marks Obtained</th>
                          <th className="px-4 py-3 font-semibold text-center">Percentage (Auto)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {singleStudentMarks.subjects?.map((sub: any, idx: number) => (
                          <tr key={sub.subjectId} className="hover:bg-muted/40">
                            <td className="px-4 py-3 font-semibold">{sub.subjectName}</td>
                            <td className="px-4 py-3 text-center">
                              <Input
                                type="number"
                                className="h-8 w-24 font-mono text-center mx-auto"
                                value={sub.maxMarks}
                                onChange={(e) => {
                                  const updated = { ...singleStudentMarks }
                                  updated.subjects[idx].maxMarks = Number(e.target.value) || 0
                                  setSingleStudentMarks(updated)
                                }}
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Input
                                type="number"
                                className="h-8 w-24 font-mono font-bold text-center text-emerald-600 mx-auto"
                                value={sub.obtainedMarks}
                                onChange={(e) => {
                                  const updated = { ...singleStudentMarks }
                                  updated.subjects[idx].obtainedMarks = Number(e.target.value) || 0
                                  setSingleStudentMarks(updated)
                                }}
                              />
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-primary">
                              {sub.maxMarks > 0 ? Math.round((sub.obtainedMarks / sub.maxMarks) * 1000) / 10 : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
