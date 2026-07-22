import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { studentPortalApi } from '../api/student-portal.api'
import { Megaphone, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function StudentAnnouncementsPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['student-announcements', page],
    queryFn: () => studentPortalApi.getAnnouncements({ page, limit: 20 }),
  })

  const announcements = data?.announcements ?? []
  const pagination = data?.pagination

  if (isLoading) return <div>Loading announcements...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Class Announcements</h1>

      <div className="grid gap-4">
        {announcements.length === 0 ? (
          <div className="p-8 text-center bg-card border rounded-xl shadow-sm text-muted-foreground">
            No announcements for your class.
          </div>
        ) : (
          announcements.map((announcement: any) => (
            <div key={announcement.id} className="p-6 bg-card rounded-xl border shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-blue-100 text-blue-600 rounded-full">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{announcement.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <span>{announcement.author.firstName} {announcement.author.lastName}</span>
                    <span>•</span>
                    <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>
              <div className="mt-4 text-sm text-foreground whitespace-pre-wrap pl-12">
                {announcement.content}
                
                {announcement.attachments && announcement.attachments.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {announcement.attachments.map((url: string, i: number) => (
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
              </div>
            </div>
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
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
