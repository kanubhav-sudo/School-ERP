import { useQuery } from '@tanstack/react-query'
import { studentPortalApi } from '../api/student-portal.api'
import { Megaphone } from 'lucide-react'

export function StudentAnnouncementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-announcements'],
    queryFn: studentPortalApi.getAnnouncements,
  })

  if (isLoading) return <div>Loading announcements...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Class Announcements</h1>

      <div className="grid gap-4">
        {data?.length === 0 ? (
          <div className="p-8 text-center bg-card border rounded-xl shadow-sm text-muted-foreground">
            No announcements for your class.
          </div>
        ) : (
          data?.map((announcement: any) => (
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
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
