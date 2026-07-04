export function StudentDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Attendance</h3>
          <div className="text-3xl font-bold mt-2 text-green-600">94%</div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Due Homework</h3>
          <div className="text-3xl font-bold mt-2">3</div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Upcoming Exams</h3>
          <div className="text-3xl font-bold mt-2">2</div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Fees Due</h3>
          <div className="text-3xl font-bold mt-2 text-red-500">$150</div>
        </div>
      </div>

      <div className="p-6 bg-card rounded-xl border border-border shadow-sm min-h-[300px] flex items-center justify-center text-muted-foreground">
        Results & Announcements Widget Placeholder
      </div>
    </div>
  )
}
