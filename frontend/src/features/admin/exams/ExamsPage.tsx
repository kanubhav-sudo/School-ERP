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
  type ExamDto,
  type ExamScheduleDto,
} from './api'
import { fetchSessions } from '../academic-sessions/api'
import { fetchClasses } from '../classes/api'
import { fetchSubjects } from '../subjects/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  Eye,
  Plus,
  Trash2,
  Save,
  Settings,
  Lock,
  Unlock,
  FileCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { AdmitCardModal } from './components/AdmitCardModal'
import { ResultCardModal } from './components/ResultCardModal'
import { ExamTemplateModal } from './components/ExamTemplateModal'

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
  const [templateType, setTemplateType] = useState<'ADMIT_CARD' | 'RESULT'>('ADMIT_CARD')

  const [admitCardModalOpen, setAdmitCardModalOpen] = useState(false)
  const [selectedAdmitCardStudent, setSelectedAdmitCardStudent] = useState<any>(null)

  const [resultCardModalOpen, setResultCardModalOpen] = useState(false)
  const [selectedResultStudent, setSelectedResultStudent] = useState<any>(null)
  const [selectedResultMarksData, setSelectedResultMarksData] = useState<any>(null)

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

  // Set active default session
  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      const active = sessions.find((s) => s.isActive) || sessions[0]
      setSelectedSessionId(active.id)
    }
  }, [sessions, selectedSessionId])

  // Set default class
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id)
    }
  }, [classes, selectedClassId])

  // Fetch current exams for selected Session & Class
  const { data: exams = [] } = useQuery({
    queryKey: ['exams', selectedSessionId, selectedClassId],
    queryFn: () =>
      fetchExams({
        sessionId: selectedSessionId || undefined,
        classId: selectedClassId || undefined,
      }),
    enabled: !!selectedSessionId && !!selectedClassId,
  })

  const currentExam = exams.find((e) => e.name === examName) || exams[0] || null

  // Populate schedule rows when exam changes
  useEffect(() => {
    if (currentExam?.schedules) {
      setScheduleRows(
        currentExam.schedules.map((s) => ({
          subjectId: s.subjectId,
          examDate: s.examDate ? s.examDate.slice(0, 10) : '',
          startTime: s.startTime || '09:00 AM',
          endTime: s.endTime || '12:00 PM',
          room: s.room || 'Main Hall',
        }))
      )
      setExamName(currentExam.name)
    }
  }, [currentExam])

  // Admit Card Students Query
  const { data: admitCardStudents = [], refetch: refetchAdmitCardStudents } = useQuery({
    queryKey: ['admit-card-students', selectedSessionId, selectedClassId, currentExam?.id],
    queryFn: () =>
      fetchAdmitCardStudents(selectedSessionId, selectedClassId, currentExam?.id),
    enabled: !!selectedSessionId && !!selectedClassId && mainModule === 'ADMIT_CARD' && admitCardTab === 'STUDENTS',
  })

  // Result Students Query
  const { data: resultStudents = [], refetch: refetchResultStudents } = useQuery({
    queryKey: ['result-students', selectedSessionId, selectedClassId, currentExam?.id],
    queryFn: () =>
      fetchResultStudents(selectedSessionId, selectedClassId, currentExam?.id || ''),
    enabled: !!selectedSessionId && !!selectedClassId && !!currentExam?.id && mainModule === 'RESULT',
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
          sessionId: selectedSessionId,
          classId: selectedClassId,
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
    },
  })

  // Update Result Release Status Mutation
  const updateResultStatusMutation = useMutation({
    mutationFn: updateResultStatus,
    onSuccess: () => {
      refetchResultStudents()
    },
  })

  // Add new timetable row
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

  // Handle open student admit card preview
  const handleViewAdmitCard = (student: any) => {
    setSelectedAdmitCardStudent(student)
    setAdmitCardModalOpen(true)
  }

  // Handle open student result card preview
  const handleViewResult = async (student: any) => {
    if (!currentExam?.id) return
    const marksData = await fetchStudentMarks(currentExam.id, student.studentId)
    setSelectedResultStudent(student)
    setSelectedResultMarksData(marksData)
    setResultCardModalOpen(true)
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setTemplateType(mainModule)
            setTemplateModalOpen(true)
          }}
        >
          <Settings className="h-4 w-4 mr-1.5" />
          Edit {mainModule === 'ADMIT_CARD' ? 'Admit Card' : 'Result'} Template
        </Button>
      </div>

      {/* COMMON ENTRY: Academic Session → Class (NO Section filter) */}
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
                            <Input
                              type="date"
                              className="h-9 w-40 font-mono text-xs"
                              value={row.examDate}
                              onChange={(e) => {
                                const updated = [...scheduleRows]
                                updated[index].examDate = e.target.value
                                setScheduleRows(updated)
                              }}
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
                                sessionId: selectedSessionId,
                                examId: currentExam?.id,
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
                              handleViewAdmitCard({
                                name: `${st.firstName} ${st.lastName}`,
                                admissionNumber: st.admissionNumber,
                                rollNumber: st.rollNumber,
                                className: classes.find((c) => c.id === selectedClassId)?.name || '',
                                sectionName: st.sectionName,
                                sessionName: sessions.find((s) => s.id === selectedSessionId)?.name,
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
                              className: classes.find((c) => c.id === selectedClassId)?.name || '',
                              sectionName: st.sectionName,
                              sessionName: sessions.find((s) => s.id === selectedSessionId)?.name,
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

      {/* Admit Card Modal */}
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

      {/* Result Card Modal */}
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
