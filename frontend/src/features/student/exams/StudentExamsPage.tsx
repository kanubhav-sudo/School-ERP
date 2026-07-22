import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { studentPortalApi } from '../api/student-portal.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Lock,
  Download,
  Calendar,
  Award,
  AlertCircle,
  Printer,
  CheckCircle2,
} from 'lucide-react'
import { AdmitCardModal } from '@/features/admin/exams/components/AdmitCardModal'
import { ResultCardModal } from '@/features/admin/exams/components/ResultCardModal'

export function StudentExamsPage() {
  const [activeTab, setActiveTab] = useState<'ADMIT_CARD' | 'RESULT'>('ADMIT_CARD')

  const [admitCardModalOpen, setAdmitCardModalOpen] = useState(false)
  const [resultCardModalOpen, setResultCardModalOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['student-exams'],
    queryFn: studentPortalApi.getExams,
  })

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Loading exams and results...
      </div>
    )
  }

  const exams = data?.exams || []
  const reportCards = data?.reportCards || []
  const admitCards = data?.admitCards || []
  const hasUnpaidFees = data?.hasUnpaidFees || false

  const latestAdmitCard = admitCards[0] || null
  const latestReportCard = reportCards[0] || null
  const currentExam = exams[0] || null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exams & Results</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Access your examination admit cards and academic result performance cards
        </p>
      </div>

      {/* Main Module Toggle: Admit Card | Result */}
      <div className="flex border-b border-border">
        <button
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'ADMIT_CARD'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('ADMIT_CARD')}
        >
          Admit Card
        </button>
        <button
          className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'RESULT'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('RESULT')}
        >
          Result
        </button>
      </div>

      {/* ADMIT CARD TAB */}
      {activeTab === 'ADMIT_CARD' && (
        <div className="space-y-4">
          {!latestAdmitCard || latestAdmitCard.isBlocked ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-base">
                <Lock className="h-5 w-5 text-rose-600" />
                Admit Card Status: HOLD
              </div>
              <p className="text-sm font-medium">
                Reason:{' '}
                {latestAdmitCard?.blockReason ||
                  (hasUnpaidFees
                    ? 'Fees Pending'
                    : 'Held By Administration / School Verification Pending')}
              </p>
              <p className="text-xs text-muted-foreground pt-1">
                If fees are pending, please clear dues with administration to download your Admit Card.
              </p>
            </div>
          ) : (
            <Card className="border-emerald-200 dark:border-emerald-900 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Admit Card Available
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your official examination admit card has been released and verified.
                  </p>
                </div>
                <Button onClick={() => setAdmitCardModalOpen(true)}>
                  <Printer className="h-4 w-4 mr-1.5" /> View & Print PDF
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/40 rounded-lg text-xs space-y-2 border">
                  <div>
                    Exam Name:{' '}
                    <span className="font-bold text-foreground">
                      {latestAdmitCard.exam?.name || currentExam?.name || 'Examination'}
                    </span>
                  </div>
                  <div>
                    Status:{' '}
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                      RELEASED
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Examination Schedule Table */}
          {currentExam?.schedules && currentExam.schedules.length > 0 && (
            <div className="border rounded-xl bg-card overflow-hidden shadow-sm mt-6">
              <div className="p-4 border-b bg-muted/50 font-bold text-sm">
                Examination Schedule ({currentExam.name})
              </div>
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/60 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Day</th>
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Subject</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {currentExam.schedules.map((s: any) => {
                    const dateStr = s.examDate ? s.examDate.slice(0, 10) : ''
                    const dayStr = dateStr
                      ? new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' })
                      : ''
                    return (
                      <tr key={s.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono font-medium">{dateStr}</td>
                        <td className="px-4 py-3 font-semibold text-primary">{dayStr}</td>
                        <td className="px-4 py-3">
                          {s.startTime} - {s.endTime}
                        </td>
                        <td className="px-4 py-3 font-semibold">{s.subject?.name}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* RESULT TAB */}
      {activeTab === 'RESULT' && (
        <div className="space-y-4">
          {!latestReportCard || latestReportCard.isBlocked ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-base">
                <Lock className="h-5 w-5 text-rose-600" />
                Result Status: HOLD
              </div>
              <p className="text-sm font-medium">
                Reason:{' '}
                {latestReportCard?.blockReason ||
                  (hasUnpaidFees
                    ? 'Fees Pending'
                    : 'Held By Admin / Result Marks Entry In Progress')}
              </p>
              <p className="text-xs text-muted-foreground pt-1">
                Results are published by school administration once marks entry is complete and all fee dues are cleared.
              </p>
            </div>
          ) : (
            <Card className="border-emerald-200 dark:border-emerald-900 shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Academic Result Released
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your official result performance report has been declared.
                  </p>
                </div>
                <Button onClick={() => setResultCardModalOpen(true)}>
                  <Printer className="h-4 w-4 mr-1.5" /> View & Print Result PDF
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/40 rounded-lg text-xs border">
                  <div>
                    <span className="text-muted-foreground block font-medium">Exam Name</span>
                    <span className="font-bold text-foreground">{latestReportCard.exam?.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Marks Obtained</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {latestReportCard.obtainedMarks} / {latestReportCard.totalMarks}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Overall Percentage</span>
                    <span className="font-mono font-bold text-primary">
                      {latestReportCard.percentage}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block font-medium">Grade</span>
                    <Badge variant="outline" className="font-bold text-xs bg-emerald-100 text-emerald-800 border-emerald-300">
                      {latestReportCard.grade || 'PASSED'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Modal Previews */}
      {latestAdmitCard && !latestAdmitCard.isBlocked && (
        <AdmitCardModal
          open={admitCardModalOpen}
          onOpenChange={setAdmitCardModalOpen}
          student={{
            name: `${latestAdmitCard.student?.firstName || ''} ${latestAdmitCard.student?.lastName || ''}`,
            admissionNumber: latestAdmitCard.student?.admissionNumber || '',
            rollNumber: latestAdmitCard.student?.rollNumber || '-',
            className: latestAdmitCard.student?.class?.name || '',
            sectionName: latestAdmitCard.student?.section?.name || '',
            sessionName: latestAdmitCard.student?.session?.name || '',
          }}
          examName={latestAdmitCard.exam?.name || 'Examination'}
          timetable={(currentExam?.schedules || []).map((s: any) => ({
            date: s.examDate ? s.examDate.slice(0, 10) : '',
            day: s.examDate ? new Date(s.examDate.slice(0, 10)).toLocaleDateString('en-US', { weekday: 'long' }) : '',
            time: `${s.startTime} - ${s.endTime}`,
            subject: s.subject?.name || 'Subject',
            room: s.room,
          }))}
        />
      )}

      {latestReportCard && !latestReportCard.isBlocked && (
        <ResultCardModal
          open={resultCardModalOpen}
          onOpenChange={setResultCardModalOpen}
          student={{
            name: `${latestReportCard.student?.firstName || ''} ${latestReportCard.student?.lastName || ''}`,
            admissionNumber: latestReportCard.student?.admissionNumber || '',
            rollNumber: latestReportCard.student?.rollNumber || '-',
            className: latestReportCard.student?.class?.name || '',
            sectionName: latestReportCard.student?.section?.name || '',
            sessionName: latestReportCard.student?.session?.name || '',
          }}
          examName={latestReportCard.exam?.name || 'Examination'}
          subjects={latestReportCard.marks || []}
          totalMaxMarks={latestReportCard.totalMarks || 100}
          totalObtainedMarks={latestReportCard.obtainedMarks || 0}
          overallPercentage={latestReportCard.percentage || 0}
        />
      )}
    </div>
  )
}
