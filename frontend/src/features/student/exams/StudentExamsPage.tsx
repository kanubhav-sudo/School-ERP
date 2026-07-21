import { useQuery } from '@tanstack/react-query'
import { studentPortalApi } from '../api/student-portal.api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Download, FileBadge } from 'lucide-react'

export function StudentExamsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-exams'],
    queryFn: studentPortalApi.getExams,
  })

  if (isLoading) return <div>Loading exams and results...</div>

  const exams = data?.exams || []
  const reportCards = data?.reportCards || []
  const admitCards = data?.admitCards || []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Exams & Results</h1>

      {/* Admit Cards */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/50 font-medium">Admit Cards</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admit Card Title</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admitCards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No admit cards generated.
                </TableCell>
              </TableRow>
            ) : (
              admitCards.map((card: any) => (
                <TableRow key={card.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileBadge className="w-4 h-4 text-muted-foreground" />
                    Admit Card
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(card.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <a href={card.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center justify-end gap-1">
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Exams */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/50 font-medium">Upcoming & Past Exams</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exam Name</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No exams found for the current session.
                </TableCell>
              </TableRow>
            ) : (
              exams.map((exam: any) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    {exam.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(exam.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <button className="text-sm text-primary hover:underline">
                      View Schedule
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Report Cards */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/50 font-medium">Report Cards</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exam</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportCards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No report cards generated yet.
                </TableCell>
              </TableRow>
            ) : (
              reportCards.map((report: any) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    {report.exam?.name} - Result
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <a href={report.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline flex items-center justify-end gap-1">
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
