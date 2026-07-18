import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchExams,
  fetchTeacherSections,
  fetchExamStudents,
  uploadAdmitCard,
  uploadReportCard,
} from '../teacher-portal.api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FileUp, FileText, AlertCircle, Edit2 } from 'lucide-react'

export function TeacherExamsPage() {
  const queryClient = useQueryClient()
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [selectedExamId, setSelectedExamId] = useState('')

  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['teacher-sections'],
    queryFn: fetchTeacherSections,
  })

  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ['teacher-exams'],
    queryFn: fetchExams,
  })

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['teacher-exam-students', selectedSectionId, selectedExamId],
    queryFn: () => fetchExamStudents(selectedSectionId, selectedExamId),
    enabled: !!selectedSectionId,
  })

  // Simulated upload mutations for UI demo
  const admitCardMutation = useMutation({
    mutationFn: uploadAdmitCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-exam-students'] })
    },
  })

  const reportCardMutation = useMutation({
    mutationFn: uploadReportCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-exam-students'] })
    },
  })

  const handleUploadAdmitCard = (studentId: string) => {
    const url = prompt('Enter Admit Card File URL (Simulated Upload):')
    if (url) {
      admitCardMutation.mutate({
        sessionId: 'current-session-id', // Simulated
        studentId,
        fileUrl: url,
        sectionId: selectedSectionId,
      })
    }
  }

  const handleUploadReportCard = (studentId: string) => {
    if (!selectedExamId) {
      alert('Please select an exam first')
      return
    }
    const url = prompt('Enter Report Card File URL (Simulated Upload):')
    if (url) {
      reportCardMutation.mutate({
        examId: selectedExamId,
        studentId,
        fileUrl: url,
        sectionId: selectedSectionId,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exams & Results</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage admit cards and report cards for your assigned sections.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 p-4 bg-card rounded-xl border shadow-sm">
        <div className="flex-1 min-w-[240px] space-y-1.5">
          <label className="text-sm font-medium">Class & Section</label>
          <Select
            value={selectedSectionId}
            onValueChange={(val) => setSelectedSectionId(val || '')}
            disabled={sectionsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select section">
                {selectedSectionId
                  ? (() => {
                      const s = sections?.find((sec) => sec.id === selectedSectionId)
                      return s ? `${s.className} - ${s.name}` : undefined
                    })()
                  : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sections?.map((sec) => (
                <SelectItem key={sec.id} value={sec.id}>
                  {sec.className} - {sec.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[240px] space-y-1.5">
          <label className="text-sm font-medium">Exam (Optional for Admit Cards)</label>
          <Select value={selectedExamId} onValueChange={(val) => setSelectedExamId(val || '')} disabled={examsLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Select exam">
                {selectedExamId === 'none'
                  ? '-- All Exams --'
                  : selectedExamId
                    ? exams?.find((e) => e.id === selectedExamId)?.name
                    : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- All Exams --</SelectItem>
              {exams?.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedSectionId ? (
        studentsLoading ? (
          <div className="p-12 text-center text-muted-foreground border rounded-xl border-dashed">
            Loading students...
          </div>
        ) : students && students.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Student
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Roll No
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Fee Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Admit Card
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                        Report Card
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-muted/30">
                        <td className="py-3 px-4">
                          <div className="font-medium">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {student.admissionNumber}
                          </div>
                        </td>
                        <td className="py-3 px-4">{student.rollNumber || '-'}</td>
                        <td className="py-3 px-4">
                          {student.hasUnpaidFees ? (
                            <Badge variant="destructive" className="flex items-center w-fit gap-1">
                              <AlertCircle className="h-3 w-3" /> Unpaid Dues
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-0">
                              Cleared
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {student.admitCard ? (
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" className="h-8 text-blue-600">
                                <FileText className="h-4 w-4 mr-1.5" /> View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleUploadAdmitCard(student.id)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => handleUploadAdmitCard(student.id)}
                            >
                              <FileUp className="h-3.5 w-3.5 mr-1.5" /> Upload
                            </Button>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {student.reportCard ? (
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" className="h-8 text-blue-600">
                                <FileText className="h-4 w-4 mr-1.5" /> View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleUploadReportCard(student.id)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              disabled={!selectedExamId}
                              onClick={() => handleUploadReportCard(student.id)}
                            >
                              <FileUp className="h-3.5 w-3.5 mr-1.5" /> Upload
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="p-12 text-center text-muted-foreground border rounded-xl border-dashed">
            No students found in this section.
          </div>
        )
      ) : (
        <div className="p-12 text-center text-muted-foreground border rounded-xl border-dashed">
          Please select a section to view and manage exam documents.
        </div>
      )}
    </div>
  )
}


