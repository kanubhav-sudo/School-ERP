import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchTeacherHomeworks,
  createHomework,
  updateHomework,
  deleteHomework,
  fetchMyClasses,
  type HomeworkDto,
  type CreateHomeworkPayload,
} from '../teacher-portal.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  Calendar,
  Users,
  Eye,
  EyeOff,
  Search,
  ClipboardList,
} from 'lucide-react'
import { format, isPast } from 'date-fns'

type FilterState = { classId: string; sectionId: string; subjectId: string; status: string }

const EMPTY_FORM: CreateHomeworkPayload = {
  title: '',
  description: '',
  dueDate: '',
  attachmentUrl: '',
  marks: undefined,
  status: 'PUBLISHED',
  sessionId: '',
  classId: '',
  sectionId: '',
  subjectId: '',
}

export function TeacherHomeworkPage() {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<HomeworkDto | null>(null)
  const [form, setForm] = useState<CreateHomeworkPayload>(EMPTY_FORM)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [retainedAttachment, setRetainedAttachment] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({ classId: '', sectionId: '', subjectId: '', status: '' })
  const [search, setSearch] = useState('')

  const { data: homeworks = [], isLoading } = useQuery({
    queryKey: ['teacher-homework', filters],
    queryFn: () => fetchTeacherHomeworks({
      classId: filters.classId || undefined,
      sectionId: filters.sectionId || undefined,
      subjectId: filters.subjectId || undefined,
      status: filters.status || undefined,
    }),
  })

  const { data: myClasses = [] } = useQuery({
    queryKey: ['teacher-my-classes'],
    queryFn: fetchMyClasses,
  })

  const createMutation = useMutation({
    mutationFn: createHomework,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-homework'] })
      closeForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      updateHomework(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-homework'] })
      closeForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteHomework,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacher-homework'] }),
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setAttachment(null)
    setRetainedAttachment(null)
    setIsFormOpen(true)
  }

  function openEdit(hw: HomeworkDto) {
    setEditing(hw)
    setForm({
      title: hw.title,
      description: hw.description || '',
      dueDate: hw.dueDate ? hw.dueDate.substring(0, 10) : '',
      attachmentUrl: hw.attachmentUrl || '',
      marks: hw.marks ?? undefined,
      status: hw.status,
      sessionId: hw.sessionId,
      classId: hw.classId,
      sectionId: hw.sectionId,
      subjectId: hw.subjectId,
    })
    setAttachment(null)
    setRetainedAttachment(hw.attachmentUrl || null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setAttachment(null)
    setRetainedAttachment(null)
  }

  function handleSubmit() {
    if (!form.title || !form.dueDate || !form.classId || !form.sectionId || !form.subjectId) return

    const formData = new FormData()
    formData.append('title', form.title)
    if (form.description) formData.append('description', form.description)
    formData.append('dueDate', form.dueDate)
    if (form.marks !== undefined) formData.append('marks', form.marks.toString())
    formData.append('status', form.status)
    if (attachment) {
      formData.append('attachment', attachment)
    }

    if (editing) {
      if (retainedAttachment) {
        formData.append('retainedAttachment', retainedAttachment)
      }
      updateMutation.mutate({ id: editing.id, data: formData })
    } else {
      // Derive sessionId from selected class assignment
      const assignment = myClasses.find(
        c => c.classId === form.classId && c.sectionId === form.sectionId
      )
      if (!assignment) return
      
      formData.append('sessionId', assignment.sessionId)
      formData.append('classId', form.classId)
      formData.append('sectionId', form.sectionId)
      formData.append('subjectId', form.subjectId)
      
      createMutation.mutate(formData)
    }
  }

  // Unique classes from assignments
  const uniqueClasses = Array.from(
    new Map(myClasses.map(c => [c.classId, { id: c.classId, name: c.className }])).values()
  )

  const sectionsForClass = myClasses
    .filter(c => c.classId === form.classId)
    .map(c => ({ id: c.sectionId, name: c.sectionName }))

  const subjectsForSection = myClasses
    .filter(c => c.sectionId === form.sectionId)
    .flatMap(c => c.subjects)

  const displayed = homeworks.filter(h =>
    search ? h.title.toLowerCase().includes(search.toLowerCase()) : true
  )

  const statusBadge = (hw: HomeworkDto) => {
    if (hw.status === 'DRAFT') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    if (isPast(new Date(hw.dueDate))) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  }
  const statusLabel = (hw: HomeworkDto) => {
    if (hw.status === 'DRAFT') return 'Draft'
    if (isPast(new Date(hw.dueDate))) return 'Overdue'
    return 'Active'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Homework</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage assignments for your sections.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Homework
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border rounded-md text-sm bg-card shadow-sm focus:outline-none focus:ring-1 focus:ring-ring w-48"
          />
        </div>
        <select
          className="px-3 py-2 border rounded-md text-sm bg-card"
          value={filters.classId}
          onChange={e => setFilters(f => ({ ...f, classId: e.target.value, sectionId: '', subjectId: '' }))}
        >
          <option value="">All Classes</option>
          {uniqueClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          className="px-3 py-2 border rounded-md text-sm bg-card"
          value={filters.sectionId}
          onChange={e => setFilters(f => ({ ...f, sectionId: e.target.value }))}
        >
          <option value="">All Sections</option>
          {myClasses
            .filter(c => !filters.classId || c.classId === filters.classId)
            .map(c => <option key={c.sectionId} value={c.sectionId}>{c.sectionName}</option>)}
        </select>
        <select
          className="px-3 py-2 border rounded-md text-sm bg-card"
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
        {Object.values(filters).some(Boolean) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ classId: '', sectionId: '', subjectId: '', status: '' })}
          >
            Clear
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
          <p className="text-muted-foreground text-sm mt-1">Create an assignment to get started.</p>
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
                    href={`http://localhost:3000${hw.attachmentUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    📎 View Attachment
                  </a>
                )}
                <div className="flex gap-2 pt-1 border-t">
                  <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={() => openEdit(hw)}>
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-muted-foreground"
                    onClick={() => updateMutation.mutate({ id: hw.id, data: { status: hw.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' } })}
                    title={hw.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                  >
                    {hw.status === 'PUBLISHED' ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-red-600 hover:text-red-700"
                    onClick={() => { if (confirm('Delete this homework?')) deleteMutation.mutate(hw.id) }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={v => !v && closeForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Homework' : 'Create Homework'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Title *</label>
              <Input
                placeholder="e.g. Chapter 4 Exercise"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                placeholder="Describe the homework..."
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            {!editing && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Class *</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                      value={form.classId}
                      onChange={e => setForm(f => ({ ...f, classId: e.target.value, sectionId: '', subjectId: '' }))}
                    >
                      <option value="">Select class</option>
                      {uniqueClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Section *</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                      value={form.sectionId}
                      onChange={e => setForm(f => ({ ...f, sectionId: e.target.value, subjectId: '' }))}
                    >
                      <option value="">Select section</option>
                      {sectionsForClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Subject *</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                    value={form.subjectId}
                    onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
                  >
                    <option value="">Select subject</option>
                    {subjectsForSection.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Due Date *</label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Marks (optional)</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g. 20"
                  value={form.marks ?? ''}
                  onChange={e => setForm(f => ({ ...f, marks: e.target.value ? parseInt(e.target.value) : undefined }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Attachment PDF (optional)</label>
              <Input
                type="file"
                accept=".pdf,application/pdf"
                onChange={e => {
                  if (e.target.files && e.target.files.length > 0) {
                    setAttachment(e.target.files[0])
                    setRetainedAttachment(null) // Clear retained if new one is selected
                  } else {
                    setAttachment(null)
                  }
                }}
              />
              {retainedAttachment && (
                <div className="mt-2 flex items-center justify-between bg-muted p-2 rounded text-sm">
                  <a href={`http://localhost:3000${retainedAttachment}`} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                    {retainedAttachment.split('/').pop()}
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 h-6 px-2"
                    onClick={() => setRetainedAttachment(null)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Publish Status</label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as 'DRAFT' | 'PUBLISHED' }))}
              >
                <option value="PUBLISHED">Published (visible to students)</option>
                <option value="DRAFT">Draft (hidden from students)</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
