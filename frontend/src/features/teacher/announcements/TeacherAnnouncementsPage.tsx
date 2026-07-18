import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  fetchTeacherSections,
  type AnnouncementDto,
} from '../teacher-portal.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Pin, Trash2, Edit2 } from 'lucide-react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function TeacherAnnouncementsPage() {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementDto | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [isPinned, setIsPinned] = useState(false)

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['teacher-announcements'],
    queryFn: fetchAnnouncements,
  })

  const { data: sections } = useQuery({
    queryKey: ['teacher-sections'],
    queryFn: fetchTeacherSections,
  })

  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-announcements'] })
      closeForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: Parameters<typeof updateAnnouncement>[1] }) =>
      updateAnnouncement(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-announcements'] })
      closeForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-announcements'] })
    },
  })

  const openFormForCreate = () => {
    setTitle('')
    setContent('')
    setSectionId('')
    setIsPinned(false)
    setEditingAnnouncement(null)
    setIsFormOpen(true)
  }

  const openFormForEdit = (ann: AnnouncementDto) => {
    setTitle(ann.title)
    setContent(ann.content)
    setSectionId(ann.sectionId)
    setIsPinned(ann.isPinned)
    setEditingAnnouncement(ann)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingAnnouncement(null)
  }

  const handleSave = () => {
    if (!title || !content || !sectionId) return

    const selectedSection = sections?.find((s) => s.id === sectionId)
    if (!selectedSection) return

    if (editingAnnouncement) {
      updateMutation.mutate({
        id: editingAnnouncement.id,
        payload: { title, content, isPinned },
      })
    } else {
      createMutation.mutate({
        title,
        content,
        isPinned,
        sessionId: 'dummy-replaced-by-backend', // typically the backend figures this out from the section or we need to pass it
        classId: selectedSection.classId,
        sectionId: selectedSection.id,
      })
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading announcements...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage announcements for your classes.
          </p>
        </div>
        <Button onClick={openFormForCreate}>+ New Announcement</Button>
      </div>

      <div className="grid gap-4">
        {!announcements || announcements.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground border rounded-xl border-dashed">
            You haven&apos;t posted any announcements yet.
          </div>
        ) : (
          announcements.map((ann) => (
            <Card key={ann.id} className={ann.isPinned ? 'border-primary/50' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {ann.isPinned && <Pin className="h-4 w-4 text-primary" />}
                      {ann.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {format(new Date(ann.createdAt), 'PPP')} • {ann.class.name} {ann.section.name}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openFormForEdit(ann)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this announcement?')) {
                          deleteMutation.mutate(ann.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{ann.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Class & Section</label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                disabled={!!editingAnnouncement}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a section</option>
                {sections?.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.className} - {sec.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your announcement..."
                rows={5}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pin"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="pin" className="text-sm font-medium cursor-pointer">
                Pin to top
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title || !content || !sectionId || createMutation.isPending || updateMutation.isPending}
            >
              {editingAnnouncement ? 'Save Changes' : 'Post Announcement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
