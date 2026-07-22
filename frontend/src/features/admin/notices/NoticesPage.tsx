import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { fetchNotices, deleteNotice } from './api'
import type { Notice } from './api'
import { NoticeForm } from './components/NoticeForm'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { Plus, Edit2, Trash2, Megaphone } from 'lucide-react'

export function NoticesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | undefined>()
  const [filters, setFilters] = useState({ page: 1, limit: 12 })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notices', filters],
    queryFn: () => fetchNotices(filters),
    placeholderData: keepPreviousData,
  })

  const notices = data?.notices ?? []
  const pagination = data?.pagination

  const deleteMutation = useMutation({
    mutationFn: deleteNotice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] })
    },
  })

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice)
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this notice?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingNotice(undefined)
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Noticeboard</h1>
          <p className="text-muted-foreground">Manage school announcements and notices</p>
        </div>
        <Button onClick={() => {
          setEditingNotice(undefined)
          setIsFormOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" /> Add Notice
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col"
          >
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  <Megaphone className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold leading-none tracking-tight">{notice.title}</h3>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(notice)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(notice.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 flex-grow whitespace-pre-wrap line-clamp-3">
                {notice.content}
              </p>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-auto pt-4 border-t">
                <span
                  className={`px-2 py-1 rounded-full ${
                    notice.priority === 'URGENT'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : notice.priority === 'HIGH'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {notice.priority}
                </span>
                <span className="flex items-center px-2 py-1 bg-secondary rounded-full">
                  {format(new Date(notice.publishedAt), 'MMM d, yyyy')}
                </span>
                {notice.expiresAt && (
                  <span className="flex items-center px-2 py-1 bg-secondary rounded-full">
                    Expires: {format(new Date(notice.expiresAt), 'MMM d')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {notices.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            No notices found
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingNotice ? 'Edit Notice' : 'Create Notice'}</DialogTitle>
          </DialogHeader>
          <NoticeForm key={editingNotice?.id || 'new'} notice={editingNotice} onClose={handleCloseForm} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
