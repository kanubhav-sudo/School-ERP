import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchExams,
  fetchAdmitCardStudents,
  updateAdmitCardStatus,
  fetchSubjectMarks,
  saveSubjectMarks,
  fetchStudentMarks,
  saveStudentMarks,
} from '@/features/admin/exams/api'
import { fetchSessions } from '@/features/admin/academic-sessions/api'
import { fetchClasses } from '@/features/admin/classes/api'
import { fetchTeacherSections } from '../teacher-portal.api'
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
import { Calendar, Save, CheckCircle2, AlertCircle, FileCheck, Edit3, UserCheck } from 'lucide-react'

function getDayFromDateString(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { weekday: 'long' })
}

export function TeacherExamsPage() {
  const queryClient = useQueryClient()

  // Common Entry State
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [selectedClassId, setSelectedClassId] = useState<string>('')

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

  // Fetch Master Data
  const { data: sessions = [] } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: fetchSessions,
  })

  const { data: teacherSections = [] } = useQuery({
    queryKey: ['teacher-sections'],
    queryFn: fetchTeacherSections,
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })

  // Auto select session
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      const active = sessions.find((s) => s.isActive) || sessions[0]
      setSelectedSessionId(active.id)
    }
  }, [sessions, selectedSessionId])

  // Auto select class
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id)
    }
  }, [classes, selectedClassId])

  // Fetch Exams for selected Session & Class
  const { data: exams = [] } = useQuery({
    queryKey: ['teacher-exams', selectedSessionId, selectedClassId],
    queryFn: () =>
      fetchExams({
        sessionId: selectedSessionId || undefined,
        classId: selectedClassId || undefined,
      }),
    enabled: !!selectedSessionId && !!selectedClassId,
  })

  const currentExam = exams[0] || null

  // Fetch Admit Card Students
  const { data: admitCardStudents = [], refetch: refetchAdmitCardStudents } = useQuery({
    queryKey: ['teacher-admit-card-students', selectedSessionId, selectedClassId, currentExam?.id],
    queryFn: () =>
      fetchAdmitCardStudents(selectedSessionId, selectedClassId, currentExam?.id),
    enabled: !!selectedSessionId && !!selectedClassId && mainModule === 'ADMIT_CARD' && admitCardTab === 'STUDENTS',
  })

  // Fetch Subject Marks
  const { data: subjectMarksData, refetch: refetchSubjectMarks } = useQuery({
    queryKey: ['subject-marks', currentExam?.id, selectedSubjectId],
    queryFn: () => fetchSubjectMarks(currentExam!.id, selectedSubjectId),
    enabled: !!currentExam?.id && !!selectedSubjectId && mainModule === 'RESULT' && resultTab === 'SUBJECTS',
  })

  useEffect(() => {
    if (subjectMarksData) {
      setMaxMarks(subjectMarksData.maxMarks || 100)
      setStudentMarksRows(subjectMarksData.students || [])
    }
  }, [subjectMarksData])

  // Save Subject Marks Mutation
  const saveSubjectMarksMutation = useMutation({
    mutationFn: () =>
      saveSubjectMarks(currentExam!.id, selectedSubjectId, {
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
      saveStudentMarks(currentExam!.id, selectedStudentId, {
        marks: singleStudentMarks.subjects.map((s: any) => ({
          subjectId: s.subjectId,
          maxMarks: Number(s.maxMarks) || 100,
          obtainedMarks: Number(s.obtainedMarks) || 0,
          remarks: s.remarks,
        })),
      }),
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
        <h1 className="text-3xl font-bold tracking-tight">Exams & Marks Entry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Teacher evaluation interface: View timetables, recommend admit cards, and enter subject marks.
        </p>
      </div>

      {/* COMMON ENTRY: Session → Class */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-wrap items-center gap-6">
        <div className="space-y-1.5 flex-1 min-w-[220px]">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Academic Session
          </Label>
          <Select value={selectedSessionId} onValueChange={(v) => setSelectedSessionId(v)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select Session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} {s.isActive ? '(Active)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 flex-1 min-w-[220px]">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Class (Includes ALL Students Across All Sections)
          </Label>
          <Select value={selectedClassId} onValueChange={(v) => setSelectedClassId(v)}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
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
                          No students found in selected Class.
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
                              className="h-8 rounded-md border text-xs font-semibold px-2 bg-background"
                              value={st.teacherStatus === 'HOLD' ? 'HOLD' : 'RELEASED'}
                              onChange={(e) => {
                                const newStatus = e.target.value as 'RELEASED' | 'HOLD'
                                recommendAdmitCardMutation.mutate({
                                  sessionId: selectedSessionId,
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
                    <Label className="text-xs font-semibold">Select Subject</Label>
                    <select
                      className="h-9 min-w-[200px] rounded-md border border-input bg-background px-3 text-xs"
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                    >
                      <option value="">-- Select Subject --</option>
                      {currentExam?.schedules?.map((sched: any) => (
                        <option key={sched.subjectId} value={sched.subjectId}>
                          {sched.subject?.name} ({sched.subject?.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Maximum Marks (Single Input)</Label>
                    <Input
                      type="number"
                      className="h-9 w-32 font-bold"
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {selectedSubjectId && (
                  <Button
                    size="sm"
                    onClick={() => saveSubjectMarksMutation.mutate()}
                    disabled={saveSubjectMarksMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-1.5" /> Save Marks
                  </Button>
                )}
              </div>

              {selectedSubjectId ? (
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
              ) : (
                <div className="p-12 text-center text-muted-foreground border rounded-xl border-dashed">
                  Select a student from the admit card list or subjects tab to edit their marks profile.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
