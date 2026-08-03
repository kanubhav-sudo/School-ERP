import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchExams,
  createExam,
  saveExamSchedules,
  fetchAdmitCardStudents,
  updateAdmitCardStatus,
  fetchResultStudents,
  updateResultStatus,
  fetchStudentMarks,
  fetchExamTemplate,
} from './api'
import { fetchSessions } from '../academic-sessions/api'
import { fetchClasses } from '../classes/api'
import { fetchSubjects } from '../subjects/api'
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
import { DatePickerInput } from '@/components/ui/date-picker-input'
import {
  Calendar,
  Eye,
  Plus,
  Trash2,
  Save,
  Settings,
  FileCheck,
} from 'lucide-react'
import { AdmitCardModal } from './components/AdmitCardModal'
import { ResultCardModal } from './components/ResultCardModal'
import { ExamTemplateModal } from './components/ExamTemplateModal'
import { AdmitCardRenderer } from '../../document-engine/components/AdmitCardRenderer'
import { ReportCardRenderer } from '../../document-engine/components/ReportCardRenderer'
import { documentEngineApi } from '../../document-engine/document-engine.api'
import type { CompiledDocumentPayload } from '../../document-engine/document-engine.types'
import { Link } from 'react-router-dom'

function getDayFromDateString(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { weekday: 'long' })
}

export function ExamsPage() {
  const queryClient = useQueryClient()

  // Common Entry State
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [selectedClassId, setSelectedClassId] = useState<string>('')

  // Main Toggle: Admit Card | Result
  const [mainModule, setMainModule] = useState<'ADMIT_CARD' | 'RESULT'>('ADMIT_CARD')

  // Admit Card Inner Toggle: Exam Table | Students
  const [admitCardTab, setAdmitCardTab] = useState<'EXAM_TABLE' | 'STUDENTS'>('EXAM_TABLE')

  // Exam Table Timetable State
  const [examName, setExamName] = useState<string>('Mid Term')
  const [scheduleRows, setScheduleRows] = useState<
    Array<{
      subjectId: string
      examDate: string
      startTime: string
      endTime: string
      room?: string
    }>
  >([])

  // Modal States
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const templateType: 'ADMIT_CARD' | 'RESULT' = mainModule === 'ADMIT_CARD' ? 'ADMIT_CARD' : 'RESULT'

  const [admitCardModalOpen, setAdmitCardModalOpen] = useState(false)
  const [selectedAdmitCardStudent, setSelectedAdmitCardStudent] = useState<any>(null)

  const [resultCardModalOpen, setResultCardModalOpen] = useState(false)
  const [selectedResultStudent, setSelectedResultStudent] = useState<any>(null)
  const [selectedResultMarksData, setSelectedResultMarksData] = useState<any>(null)

  // Document Engine — Powered Modal States
  const [engineAdmitOpen, setEngineAdmitOpen] = useState(false)
  const [engineAdmitPayload, setEngineAdmitPayload] = useState<CompiledDocumentPayload | null>(null)
  const [engineAdmitLoading, setEngineAdmitLoading] = useState(false)

  const [engineResultOpen, setEngineResultOpen] = useState(false)
  const [engineResultPayload, setEngineResultPayload] = useState<CompiledDocumentPayload | null>(null)
  const [engineResultLoading, setEngineResultLoading] = useState(false)

  // Fetch Master Data
  const { data: sessions = [] } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: fetchSessions,
  })

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  })

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: fetchSubjects,
  })

  // Auto-select active/first session — derived so no cascading setState
  const effectiveSessionId = selectedSessionId || (sessions.find((s) => s.isActive) || sessions[0])?.id || ''
  const effectiveClassId = selectedClassId || classes[0]?.id || ''

  // Fetch current exams for selected Session & Class
  const { data: exams = [] } = useQuery({
    queryKey: ['exams', effectiveSessionId, effectiveClassId],
    queryFn: () =>
      fetchExams({
        sessionId: effectiveSessionId || undefined,
        classId: effectiveClassId || undefined,
      }),
    enabled: !!effectiveSessionId && !!effectiveClassId,
  })

  const currentExam = exams.find((e) => e.name === examName) || exams[0] || null

  // Sync scheduleRows when currentExam changes
  useEffect(() => {
    const rows = currentExam?.schedules
      ? currentExam.schedules.map((s: any) => ({
          subjectId: s.subjectId,
          examDate: s.examDate ? s.examDate.slice(0, 10) : '',
          startTime: s.startTime || '09:00 AM',
          endTime: s.endTime || '12:00 PM',
          room: s.room || 'Main Hall',
        }))
      : []
    const t = setTimeout(() => setScheduleRows(rows), 0)
    return () => clearTimeout(t)
  }, [currentExam?.id, currentExam?.schedules?.length])

  // Admit Card Students Query
  const { data: admitCardStudents = [], refetch: refetchAdmitCardStudents } = useQuery({
    queryKey: ['admit-card-students', effectiveSessionId, effectiveClassId, currentExam?.id],
    queryFn: () =>
      fetchAdmitCardStudents(effectiveSessionId, effectiveClassId, currentExam?.id),
    enabled: !!effectiveSessionId && !!effectiveClassId && mainModule === 'ADMIT_CARD' && admitCardTab === 'STUDENTS',
    staleTime: 0,
  })

  // Result Students Query
  const { data: resultStudents = [], refetch: refetchResultStudents } = useQuery({
    queryKey: ['result-students', effectiveSessionId, effectiveClassId, currentExam?.id],
    queryFn: () =>
      fetchResultStudents(effectiveSessionId, effectiveClassId, currentExam?.id || ''),
    enabled: !!effectiveSessionId && !!effectiveClassId && !!currentExam?.id && mainModule === 'RESULT',
    staleTime: 0,
  })

  // Admit Card Template Query
  const { data: admitCardTemplate } = useQuery({
    queryKey: ['exam-template', 'ADMIT_CARD'],
    queryFn: () => fetchExamTemplate('ADMIT_CARD'),
  })

  // Result Template Query
  const { data: resultTemplate } = useQuery({
    queryKey: ['exam-template', 'RESULT'],
    queryFn: () => fetchExamTemplate('RESULT'),
  })

  // Save Timetable Schedules Mutation
  const saveSchedulesMutation = useMutation({
    mutationFn: async () => {
      let targetExam = currentExam
      if (!targetExam) {
        targetExam = await createExam({
          sessionId: effectiveSessionId,
          classId: effectiveClassId,
          name: examName,
          status: 'PUBLISHED',
        })
      }
      return saveExamSchedules({
        examId: targetExam.id,
        schedules: scheduleRows,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      alert('Examination timetable schedule saved successfully!')
    },
  })

  // Update Admit Card Release Status Mutation
  const updateAdmitCardStatusMutation = useMutation({
    mutationFn: updateAdmitCardStatus,
    onSuccess: () => {
      refetchAdmitCardStudents()
      queryClient.invalidateQueries({ queryKey: ['admit-card-students'] })
    },
  })

  // Update Result Release Status Mutation
  const updateResultStatusMutation = useMutation({
    mutationFn: updateResultStatus,
    onSuccess: () => {
      refetchResultStudents()
      queryClient.invalidateQueries({ queryKey: ['result-students'] })
    },
  })

  const addScheduleRow = () => {
    setScheduleRows([
      ...scheduleRows,
      {
        subjectId: subjects[0]?.id || '',
        examDate: new Date().toISOString().slice(0, 10),
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        room: 'Main Hall',
      },
    ])
  }

  // Remove timetable row
  const removeScheduleRow = (index: number) => {
    setScheduleRows(scheduleRows.filter((_, idx) => idx !== index))
  }

  // Handle open student admit card preview — Document Engine powered
  const handleViewAdmitCard = async (student: any) => {
    if (!currentExam?.id) {
      // Fallback to legacy modal if no exam exists
      setSelectedAdmitCardStudent(student)
      setAdmitCardModalOpen(true)
      return
    }
    setEngineAdmitOpen(true)
    setEngineAdmitLoading(true)
    setEngineAdmitPayload(null)
    try {
      const payload = await documentEngineApi.getLivePreview('ADMIT_CARD', {
        studentId: student.studentId,
        examId: currentExam.id,
      })
      setEngineAdmitPayload(payload)
    } catch {
      // Fallback to legacy modal on error
      setEngineAdmitOpen(false)
      setSelectedAdmitCardStudent(student)
      setAdmitCardModalOpen(true)
    } finally {
      setEngineAdmitLoading(false)
    }
  }

  // Handle open student result card preview — Document Engine powered
  const handleViewResult = async (student: any) => {
    if (!currentExam?.id) return
    setEngineResultOpen(true)
    setEngineResultLoading(true)
    setEngineResultPayload(null)
    try {
      const payload = await documentEngineApi.getLivePreview('REPORT_CARD', {
        studentId: student.studentId,
        examId: currentExam.id,
      })
      setEngineResultPayload(payload)
    } catch {
      // Fallback to legacy result card
      setEngineResultOpen(false)
      const marksData = await fetchStudentMarks(currentExam.id, student.studentId)
      setSelectedResultStudent(student)
      setSelectedResultMarksData(marksData)
      setResultCardModalOpen(true)
    } finally {
      setEngineResultLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exams & Results</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Common examination workflow across Admin, Teacher, and Student portals
          </p>
        </div>
        <Link
          to="/admin/documents"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <Settings className="h-4 w-4" />
          Document Engine Settings
        </Link>
      </div>

      {/* COMMON ENTRY: Academic Session → Class (NO Section filter) */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-wrap items-center gap-6">
        <div className="space-y-1.5 flex-1 min-w-[220px]">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Academic Session
          </Label>
          <Select value={selectedSessionId} onValueChange={(v) => setSelectedSessionId(v ?? '')}>
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
          <Select value={selectedClassId} onValueChange={(v) => setSelectedClassId(v ?? '')}>
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

      {/* MAIN MODULE TOGGLE: Admit Card | Result */}
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

      {/* ADMIT CARD INTERFACE */}
      {mainModule === 'ADMIT_CARD' && (
        <div className="space-y-6">
          {/* Inner Toggle: Exam Table | Students */}
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

          {/* EXAM TABLE (ADMIN) */}
          {admitCardTab === 'EXAM_TABLE' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Exam Name:
                  </Label>
                  <Input
                    className="w-64 h-9 bg-background"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="e.g. Mid Term, Half Yearly, Final Exam"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addScheduleRow}>
                    <Plus className="h-4 w-4 mr-1" /> Add Subject Slot
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveSchedulesMutation.mutate()}
                    disabled={saveSchedulesMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-1.5" /> Save Timetable
                  </Button>
                </div>
              </div>

              {/* Timetable Table */}
              <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/60 border-b">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Day (Auto Calculated)</th>
                      <th className="px-4 py-3 font-semibold">Time</th>
                      <th className="px-4 py-3 font-semibold">Subject</th>
                      <th className="px-4 py-3 font-semibold">Room / Hall</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {scheduleRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          No subjects added to timetable yet. Click &quot;Add Subject Slot&quot; to begin.
                        </td>
                      </tr>
                    ) : (
                      scheduleRows.map((row, index) => (
                        <tr key={index} className="hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-3">
                            <DatePickerInput
                              value={row.examDate}
                              onChange={(dateStr) => {
                                const updated = [...scheduleRows]
                                updated[index].examDate = dateStr
                                setScheduleRows(updated)
                              }}
                              fromYear={new Date().getFullYear() - 2}
                              toYear={new Date().getFullYear() + 5}
                            />
                          </td>
                          <td className="px-4 py-3 font-semibold text-primary">
                            {getDayFromDateString(row.examDate) || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              className="h-9 w-44 text-xs"
                              placeholder="09:00 AM - 12:00 PM"
                              value={row.startTime}
                              onChange={(e) => {
                                const updated = [...scheduleRows]
                                updated[index].startTime = e.target.value
                                setScheduleRows(updated)
                              }}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              className="h-9 w-48 rounded-md border border-input bg-background px-3 text-xs"
                              value={row.subjectId}
                              onChange={(e) => {
                                const updated = [...scheduleRows]
                                updated[index].subjectId = e.target.value
                                setScheduleRows(updated)
                              }}
                            >
                              {subjects.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                  {sub.name} ({sub.code})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              className="h-9 w-32 text-xs"
                              placeholder="Main Hall"
                              value={row.room || ''}
                              onChange={(e) => {
                                const updated = [...scheduleRows]
                                updated[index].room = e.target.value
                                setScheduleRows(updated)
                              }}
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeScheduleRow(index)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="h-4 w-4" />
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

          {/* STUDENTS ADMIT CARD STATUS & OVERRIDE */}
          {admitCardTab === 'STUDENTS' && (
            <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/60 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Student Name</th>
                    <th className="px-4 py-3 font-semibold">Admission No</th>
                    <th className="px-4 py-3 font-semibold">Fee Status</th>
                    <th className="px-4 py-3 font-semibold">Admit Card Status</th>
                    <th className="px-4 py-3 font-semibold">Remark</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {admitCardStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No students found for selected Class.
                      </td>
                    </tr>
                  ) : (
                    admitCardStudents.map((st: any) => (
                      <tr key={st.studentId} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {st.firstName} {st.lastName}
                        </td>
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
                            className={`h-8 rounded-md border text-xs font-semibold px-2 ${
                              st.status === 'RELEASED'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                            value={st.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as 'RELEASED' | 'HOLD'
                              updateAdmitCardStatusMutation.mutate({
                                sessionId: effectiveSessionId,
                                examId: currentExam?.id,
                                studentId: st.studentId,
                                status: newStatus,
                                role: 'ADMIN',
                              })
                            }}
                          >
                            <option value="RELEASED">Release</option>
                            <option value="HOLD">Hold</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-medium">
                          {st.remark}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleViewAdmitCard({
                                name: `${st.firstName} ${st.lastName}`,
                                admissionNumber: st.admissionNumber,
                                rollNumber: st.rollNumber,
                                className: classes.find((c) => c.id === effectiveClassId)?.name || '',
                                sectionName: st.sectionName,
                                sessionName: sessions.find((s) => s.id === effectiveSessionId)?.name,
                              })
                            }
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* RESULT INTERFACE */}
      {mainModule === 'RESULT' && (
        <div className="space-y-4">
          <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground flex items-center justify-between border border-border">
            <span>
              Official Result Release Control: Only Admin can officially release or withhold results.
            </span>
          </div>

          <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/60 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student Name</th>
                  <th className="px-4 py-3 font-semibold">Admission No</th>
                  <th className="px-4 py-3 font-semibold">Fee Status</th>
                  <th className="px-4 py-3 font-semibold">Result Status</th>
                  <th className="px-4 py-3 font-semibold">Remark</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {resultStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No students found for selected Class/Exam.
                    </td>
                  </tr>
                ) : (
                  resultStudents.map((st: any) => (
                    <tr key={st.studentId} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {st.firstName} {st.lastName}
                      </td>
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
                          className={`h-8 rounded-md border text-xs font-semibold px-2 ${
                            st.status === 'RELEASED'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                          value={st.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as 'RELEASED' | 'HOLD'
                            updateResultStatusMutation.mutate({
                              sessionId: effectiveSessionId,
                              examId: currentExam?.id || '',
                              studentId: st.studentId,
                              status: newStatus,
                            })
                          }}
                        >
                          <option value="RELEASED">Release</option>
                          <option value="HOLD">Hold</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-medium">
                        {st.remark}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleViewResult({
                              studentId: st.studentId,
                              name: `${st.firstName} ${st.lastName}`,
                              admissionNumber: st.admissionNumber,
                              rollNumber: st.rollNumber,
                              className: classes.find((c) => c.id === effectiveClassId)?.name || '',
                              sectionName: st.sectionName,
                              sessionName: sessions.find((s) => s.id === effectiveSessionId)?.name,
                            })
                          }
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View Result
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

      {/* ── Document Engine Admit Card Modal ──────────────────── */}
      {engineAdmitOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[850px]">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-900">Admit Card — Document Engine</h2>
              <button onClick={() => { setEngineAdmitOpen(false); setEngineAdmitPayload(null) }} className="text-gray-400 hover:text-gray-700 text-2xl leading-none cursor-pointer">×</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[80vh]">
              {engineAdmitLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Compiling Admit Card…</span>
                </div>
              )}
              {engineAdmitPayload && <AdmitCardRenderer payload={engineAdmitPayload} showPrintButton={true} />}
            </div>
          </div>
        </div>
      )}

      {/* ── Document Engine Report Card Modal ──────────────────── */}
      {engineResultOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[850px]">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-900">Report Card — Document Engine</h2>
              <button onClick={() => { setEngineResultOpen(false); setEngineResultPayload(null) }} className="text-gray-400 hover:text-gray-700 text-2xl leading-none cursor-pointer">×</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[80vh]">
              {engineResultLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Compiling Report Card…</span>
                </div>
              )}
              {engineResultPayload && <ReportCardRenderer payload={engineResultPayload} showPrintButton={true} />}
            </div>
          </div>
        </div>
      )}

      {/* Legacy Fallback Admit Card Modal (kept for backward compat) */}
      {selectedAdmitCardStudent && (
        <AdmitCardModal
          open={admitCardModalOpen}
          onOpenChange={setAdmitCardModalOpen}
          student={selectedAdmitCardStudent}
          examName={examName}
          timetable={scheduleRows.map((r) => ({
            date: r.examDate,
            day: getDayFromDateString(r.examDate),
            time: r.startTime,
            subject: subjects.find((s) => s.id === r.subjectId)?.name || 'Subject',
            room: r.room,
          }))}
          template={admitCardTemplate}
        />
      )}

      {/* Legacy Fallback Result Card Modal (kept for backward compat) */}
      {selectedResultStudent && selectedResultMarksData && (
        <ResultCardModal
          open={resultCardModalOpen}
          onOpenChange={setResultCardModalOpen}
          student={selectedResultStudent}
          examName={examName}
          subjects={selectedResultMarksData.subjects || []}
          totalMaxMarks={selectedResultMarksData.totalMaxMarks || 0}
          totalObtainedMarks={selectedResultMarksData.totalObtainedMarks || 0}
          overallPercentage={selectedResultMarksData.overallPercentage || 0}
          template={resultTemplate}
        />
      )}

      {/* Template Settings Modal */}
      <ExamTemplateModal
        type={templateType}
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
      />
    </div>
  )
}
