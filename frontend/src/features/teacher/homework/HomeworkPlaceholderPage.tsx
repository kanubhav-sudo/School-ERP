import { Search, Filter, Plus, BookX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HomeworkPlaceholderPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Homework</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage assignments and review student submissions.
          </p>
        </div>
        <div className="relative group">
          <Button disabled className="gap-2 pointer-events-none">
            <Plus className="h-4 w-4" />
            New Homework
          </Button>
          {/* Tooltip simulating disabled state for future milestone */}
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-max px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md border">
            Coming soon in Milestone 5
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assignments..."
            className="w-full pl-9 pr-4 py-2 border rounded-md text-sm bg-card shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            disabled
          />
        </div>
        <Button variant="outline" className="gap-2" disabled>
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-card/50 text-center p-8">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <BookX className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No homework has been assigned yet.</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Once the homework module is activated, you'll be able to create assignments, attach
          resources, and grade student submissions right here.
        </p>
        <Button variant="outline" disabled>
          Learn More
        </Button>
      </div>
    </div>
  )
}
