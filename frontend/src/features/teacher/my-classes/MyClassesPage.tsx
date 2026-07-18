import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchMyClasses } from '../teacher-portal.api'
import { BookOpen, Users, Star } from 'lucide-react'

export function MyClassesPage() {
  const navigate = useNavigate()
  const {
    data: classes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['teacher-my-classes'],
    queryFn: fetchMyClasses,
  })

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading classes...</div>
  }

  if (isError) {
    return <div className="p-8 text-center text-destructive">Failed to load classes.</div>
  }

  if (!classes || classes.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed rounded-xl mt-4">
        <p className="text-muted-foreground">
          You have no classes assigned for the current session.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Classes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your assigned classes and subjects.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <div
            key={cls.sectionId}
            className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b bg-muted/20 relative">
              {cls.isClassTeacher && (
                <div className="absolute top-4 right-4 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  Class Teacher
                </div>
              )}
              <h3 className="font-semibold text-lg">
                {cls.className} - {cls.sectionName}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">{cls.sessionName}</p>
            </div>

            <div className="p-5 flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Users className="h-4 w-4" />
                  Students
                </div>
                <p className="text-2xl font-bold">{cls.studentCount}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <BookOpen className="h-4 w-4" />
                  Subjects Taught
                </div>
                <div className="flex flex-wrap gap-2">
                  {cls.subjects.map((sub) => (
                    <span
                      key={sub.id}
                      className="bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-md font-medium border"
                    >
                      {sub.name} ({sub.code})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Manage Students
              </span>
              <button 
                onClick={() => navigate('/teacher/attendance')}
                className="text-sm font-medium text-primary hover:underline"
              >
                View Attendance &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
