import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Download } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: {
    name: string
    admissionNumber: string
    rollNumber?: string
    className: string
    sectionName?: string
    sessionName?: string
  }
  examName: string
  timetable: Array<{
    date: string
    day: string
    time: string
    subject: string
    code?: string
    room?: string
  }>
  template?: {
    schoolName?: string
    logoUrl?: string
    headerText?: string
    footerText?: string
    principalSignatureUrl?: string
    schoolStampUrl?: string
  }
}

export function AdmitCardModal({
  open,
  onOpenChange,
  student,
  examName,
  timetable,
  template,
}: Props) {
  const schoolName = template?.schoolName || 'School ERP Academy'
  const headerText = template?.headerText || 'EXAMINATION ADMIT CARD'
  const footerText = template?.footerText || 'This admit card is computer-generated and officially verified.'

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print:p-0 print:max-w-none print:shadow-none">
        <DialogHeader className="print:hidden flex flex-row items-center justify-between">
          <DialogTitle>Admit Card Preview</DialogTitle>
          <Button onClick={handlePrint} size="sm">
            <Printer className="h-4 w-4 mr-1.5" />
            Print / Download PDF
          </Button>
        </DialogHeader>

        {/* Printable Card Area */}
        <div className="border-2 border-primary/20 p-6 rounded-xl bg-card space-y-6 print:border-black print:p-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              {template?.logoUrl ? (
                <img src={template.logoUrl} alt="School Logo" className="h-16 w-16 object-contain" />
              ) : (
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl">
                  ERP
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold uppercase text-foreground">{schoolName}</h2>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mt-0.5">
                  {headerText}
                </p>
                <p className="text-xs text-primary font-medium mt-0.5">
                  {examName} · Session: {student.sessionName || 'Active'}
                </p>
              </div>
            </div>
            <div className="text-right font-mono text-xs text-muted-foreground">
              <div>Class: <span className="font-semibold text-foreground">{student.className}</span></div>
              {student.sectionName && <div>Section: <span className="font-semibold text-foreground">{student.sectionName}</span></div>}
            </div>
          </div>

          {/* Student Info Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-muted/40 rounded-lg text-xs border border-border">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Student Name</span>
              <span className="font-bold text-foreground">{student.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Admission No</span>
              <span className="font-mono font-bold text-foreground">{student.admissionNumber}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Roll Number</span>
              <span className="font-mono font-bold text-foreground">{student.rollNumber || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Class</span>
              <span className="font-bold text-foreground">{student.className}</span>
            </div>
          </div>

          {/* Timetable Table */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Examination Schedule
            </h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 uppercase text-muted-foreground border-b text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Day</th>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Subject</th>
                    <th className="px-3 py-2 text-right">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {timetable.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
                        No timetable schedules added yet.
                      </td>
                    </tr>
                  ) : (
                    timetable.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="px-3 py-2 font-mono font-medium">{row.date}</td>
                        <td className="px-3 py-2 font-semibold text-primary">{row.day}</td>
                        <td className="px-3 py-2">{row.time}</td>
                        <td className="px-3 py-2 font-medium">{row.subject}</td>
                        <td className="px-3 py-2 text-right font-mono">{row.room || 'Main Hall'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures & Stamp */}
          <div className="pt-8 flex justify-between items-end border-t text-xs">
            <div className="text-center space-y-2">
              {template?.schoolStampUrl ? (
                <img src={template.schoolStampUrl} alt="School Stamp" className="h-12 w-12 object-contain mx-auto" />
              ) : (
                <div className="h-10 w-24 border border-dashed rounded flex items-center justify-center text-[10px] text-muted-foreground">
                  [School Stamp]
                </div>
              )}
              <span className="block text-[10px] uppercase font-semibold text-muted-foreground">
                School Stamp
              </span>
            </div>

            <div className="text-center space-y-2">
              {template?.principalSignatureUrl ? (
                <img src={template.principalSignatureUrl} alt="Signature" className="h-10 w-28 object-contain mx-auto" />
              ) : (
                <div className="h-10 w-28 border-b border-foreground flex items-center justify-center italic text-xs font-serif">
                  Principal Sign
                </div>
              )}
              <span className="block text-[10px] uppercase font-semibold text-muted-foreground">
                Principal Signature
              </span>
            </div>
          </div>

          <p className="text-[10px] text-center text-muted-foreground italic border-t pt-2">
            {footerText}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
