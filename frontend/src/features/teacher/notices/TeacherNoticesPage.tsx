import { useQuery } from '@tanstack/react-query'
import { fetchNotices } from '../teacher-portal.api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

export function TeacherNoticesPage() {
  const { data: notices, isLoading, isError } = useQuery({
    queryKey: ['teacher-notices'],
    queryFn: fetchNotices,
  })

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading notices...</div>
  }

  if (isError) {
    return <div className="p-8 text-center text-destructive">Failed to load notices.</div>
  }

  if (!notices || notices.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notices</h1>
          <p className="text-sm text-muted-foreground mt-1">Official notices from the administration.</p>
        </div>
        <div className="p-12 text-center text-muted-foreground border rounded-xl border-dashed">
          No notices available at the moment.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Official notices from the administration.
        </p>
      </div>

      <div className="grid gap-4">
        {notices.map((notice) => (
          <Card key={notice.id} className={notice.priority === 'HIGH' ? 'border-destructive/50' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {notice.priority === 'HIGH' && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                    {notice.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(notice.publishedAt), 'PPP')}
                    </span>
                    <span>•</span>
                    <span>By {notice.author.username}</span>
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    notice.priority === 'HIGH'
                      ? 'destructive'
                      : notice.priority === 'MEDIUM'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {notice.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{notice.content}</p>
              {notice.attachments && notice.attachments.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {notice.attachments.map((_, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-muted/50 cursor-pointer hover:bg-muted">
                      📎 Attachment {i + 1}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
