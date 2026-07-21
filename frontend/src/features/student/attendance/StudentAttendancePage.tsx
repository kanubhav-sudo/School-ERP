import { useQuery } from '@tanstack/react-query'
import { studentPortalApi } from '../api/student-portal.api'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function StudentAttendancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-attendance'],
    queryFn: studentPortalApi.getAttendance,
  })

  if (isLoading) return <div>Loading attendance...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Overall Percentage</h3>
          <div className={`text-3xl font-bold mt-2 ${data?.summary?.percentage >= 75 ? 'text-green-600' : 'text-red-500'}`}>
            {data?.summary?.percentage}%
          </div>
        </div>
        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Present</h3>
          <div className="text-3xl font-bold mt-2 text-green-600">{data?.summary?.present}</div>
        </div>
        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Absent</h3>
          <div className="text-3xl font-bold mt-2 text-red-500">
            {data?.summary?.total - data?.summary?.present}
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/50 font-medium">Attendance History</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.records?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No attendance records found
                </TableCell>
              </TableRow>
            ) : (
              data?.records?.map((record: any) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {new Date(record.attendance.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {record.status === 'PRESENT' ? (
                      <span className="flex items-center text-green-600 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Present
                      </span>
                    ) : (
                      <span className="flex items-center text-red-500 text-sm font-medium">
                        <XCircle className="w-4 h-4 mr-1" />
                        Absent
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.remarks || '-'}
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
