import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiClient as api } from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Trash2, Search, BookOpen, Calendar, Users, ClipboardList } from 'lucide-react'
import { format, isPast } from 'date-fns'

interface AdminHomeworkItem {
  id: string
  title: string
  description: string | null
  dueDate: string
  attachmentUrl: string | null
  marks: number | null
  status: 'DRAFT' | 'PUBLISHED'
  class: { id: string; name: string }
  section: { id: string; name: string }
  subject: { id: string; name: string }
  teacher: { id: string; firstName: string; lastName: string }
  _count: { submissions: number }
  createdAt: string
}

async function fetchAllHomework(filters?: Record<string, string>): Promise<AdminHomeworkItem[]> {
  const { data } = await api.get('/homework', { params: filters })
  return data.data
}

async function deleteHomeworkAdmin(id: string): Promise<void> {
  await api.delete(`/homework/${id}`)
}

export function AdminHomeworkPage() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  const { data: homeworks = [], isLoading } = useQuery({
    queryKey: ['admin-homework', filters],
    queryFn: () => fetchAllHomework(filters),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteHomeworkAdmin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-homework'] }),
  })

  const displayed = homeworks.filter(h =>
    search
      ? h.title.toLowerCase().includes(search.toLowerCase()) ||
        `${h.teacher.firstName} ${h.teacher.lastName}`.toLowerCase().includes(search.toLowerCase())
      : true
  )

  const statusBadge = (hw: AdminHomeworkItem) => {
    if (hw.status === 'DRAFT') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    if (isPast(new Date(hw.dueDate))) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  }
  const statusLabel = (hw: AdminHomeworkItem) => {
    if (hw.status === 'DRAFT') return 'Draft'
    if (isPast(new Date(hw.dueDate))) return 'Overdue'
    return 'Active'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Homework Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor all homework assigned across classes. Delete inappropriate content if required.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="p-4 bg-card border rounded-xl">
          <p className="text-sm text-muted-foreground">Total Assignments</p>
          <p className="text-2xl font-bold mt-1">{homeworks.length}</p>
        </div>
        <div className="p-4 bg-card border rounded-xl">
          <p className="text-sm text-muted-foreground">Published</p>
          <p className="text-2xl font-bold mt-1 text-green-600">
            {homeworks.filter(h => h.status === 'PUBLISHED').length}
          </p>
        </div>
        <div className="p-4 bg-card border rounded-xl">
          <p className="text-sm text-muted-foreground">Drafts</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">
            {homeworks.filter(h => h.status === 'DRAFT').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search title or teacher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border rounded-md text-sm bg-card shadow-sm focus:outline-none focus:ring-1 focus:ring-ring w-60"
          />
        </div>
        <select
          className="px-3 py-2 border rounded-md text-sm bg-card"
          value={filters.status || ''}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
        {Object.values(filters).some(Boolean) && (
          <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">Loading...</div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl h-64 text-center p-8">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No homework found</h3>
          <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayed.map(hw => (
            <Card key={hw.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-base leading-tight">{hw.title}</CardTitle>
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(hw)}`}>
                    {statusLabel(hw)}
                  </span>
                </div>
                <CardDescription>
                  {hw.class.name} – {hw.section.name} · {hw.subject.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  By: <span className="font-medium">{hw.teacher.firstName} {hw.teacher.lastName}</span>
                </p>
                {hw.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{hw.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due {format(new Date(hw.dueDate), 'dd MMM yyyy')}
                  </span>
                  {hw.marks != null && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {hw.marks} marks
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {hw._count.submissions} submitted
                  </span>
                </div>
                {hw.attachmentUrl && (
                  <a
                    href={hw.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    📎 Attachment
                  </a>
                )}
                <div className="flex gap-2 pt-1 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 w-full text-red-600 hover:text-red-700 hover:border-red-300"
                    onClick={() => {
                      if (confirm(`Delete homework "${hw.title}"? This cannot be undone.`)) {
                        deleteMutation.mutate(hw.id)
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
