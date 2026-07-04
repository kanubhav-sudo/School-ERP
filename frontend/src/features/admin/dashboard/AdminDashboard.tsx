export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Students</h3>
          <div className="text-3xl font-bold mt-2">1,234</div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Teachers</h3>
          <div className="text-3xl font-bold mt-2">56</div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Active Classes</h3>
          <div className="text-3xl font-bold mt-2">42</div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Revenue (Term)</h3>
          <div className="text-3xl font-bold mt-2">$45,231</div>
        </div>
      </div>

      <div className="p-6 bg-card rounded-xl border border-border shadow-sm min-h-[300px] flex items-center justify-center text-muted-foreground">
        Recent Activity Widget Placeholder
      </div>
    </div>
  )
}
