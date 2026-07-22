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
  const [attachments, setAttachments] = useState<File[]>([])
  const [retainedAttachments, setRetainedAttachments] = useState<string[]>([])

  const [page, setPage] = useState(1)

  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['teacher-announcements', page],
    queryFn: () => fetchAnnouncements(page, 20),
  })

  const announcements = announcementsData?.announcements ?? []
  const pagination = announcementsData?.pagination

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
    mutationFn: (data: { id: string; payload: FormData }) =>
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
    setAttachments([])
    setRetainedAttachments([])
    setEditingAnnouncement(null)
    setIsFormOpen(true)
  }

  const openFormForEdit = (ann: AnnouncementDto) => {
    setTitle(ann.title)
    setContent(ann.content)
    setSectionId(ann.sectionId)
    setIsPinned(ann.isPinned)
    setAttachments([])
    setRetainedAttachments(ann.attachments || [])
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

    const formData = new FormData()
    formData.append('title', title)
    formData.append('content', content)
    formData.append('isPinned', isPinned.toString())
    
    attachments.forEach(file => {
      formData.append('attachments', file)
    })

    if (editingAnnouncement) {
      retainedAttachments.forEach(att => {
        formData.append('retainedAttachments', att)
      })
      updateMutation.mutate({
        id: editingAnnouncement.id,
        payload: formData,
      })
    } else {
      formData.append('classId', selectedSection.classId)
      formData.append('sectionId', selectedSection.id)

      createMutation.mutate(formData)
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
        {announcements.length === 0 ? (
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
                {ann.attachments && ann.attachments.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {ann.attachments.map((url, i) => (
                      <a
                        key={i}
                        href={`http://localhost:3000${url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
                      >
                        Attachment {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} announcements)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

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
            <div className="space-y-2">
              <label className="text-sm font-medium">Attachments</label>
              <Input
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setAttachments(Array.from(e.target.files))
                  }
                }}
              />
              {/* Display Retained Attachments for Edit Mode */}
              {retainedAttachments.length > 0 && (
                <div className="text-sm space-y-1 mt-2">
                  <p className="font-medium">Existing Attachments:</p>
                  {retainedAttachments.map((url) => (
                    <div key={url} className="flex items-center justify-between bg-muted p-2 rounded">
                      <a href={`http://localhost:3000${url}`} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                        {url.split('/').pop()}
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 h-6 px-2"
                        onClick={() => setRetainedAttachments(retainedAttachments.filter(a => a !== url))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
