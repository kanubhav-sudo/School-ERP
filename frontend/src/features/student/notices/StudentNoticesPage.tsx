import { useQuery } from '@tanstack/react-query'
import { studentPortalApi } from '../api/student-portal.api'
import { Bell } from 'lucide-react'

export function StudentNoticesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-notices'],
    queryFn: studentPortalApi.getNotices,
  })

  if (isLoading) return <div>Loading notices...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Noticeboard</h1>

      <div className="grid gap-4">
        {data?.length === 0 ? (
          <div className="p-8 text-center bg-card border rounded-xl shadow-sm text-muted-foreground">
            No notices available.
          </div>
        ) : (
          data?.map((notice: any) => (
            <div key={notice.id} className="p-6 bg-card rounded-xl border shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 bg-primary/10 rounded-full text-primary">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{notice.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Published on {new Date(notice.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {notice.priority === 'HIGH' && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                    HIGH PRIORITY
                  </span>
                )}
              </div>
              <div className="mt-4 text-sm text-foreground whitespace-pre-wrap pl-12">
                {notice.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
