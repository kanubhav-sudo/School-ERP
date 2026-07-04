import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetchSessions, deleteSession, setActiveSession, type AcademicSession } from './api'
import { SessionForm } from './components/SessionForm'
import { format } from 'date-fns'

export function AcademicSessionsPage() {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null)

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: fetchSessions,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-sessions'] })
    },
  })

  const setActiveMutation = useMutation({
    mutationFn: setActiveSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-sessions'] })
    },
  })

  const handleEdit = (session: AcademicSession) => {
    setEditingSession(session)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingSession(null)
    setIsFormOpen(true)
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Academic Sessions</h1>
        <Button onClick={handleCreate}>Add Session</Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-medium">{session.name}</TableCell>
                <TableCell>{format(new Date(session.startDate), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{format(new Date(session.endDate), 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  {session.isActive ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      Inactive
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {!session.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveMutation.mutate(session.id)}
                      disabled={setActiveMutation.isPending}
                    >
                      Set Active
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleEdit(session)}>
                    Edit
                  </Button>
                  {!session.isActive && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this session?')) {
                          deleteMutation.mutate(session.id)
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {sessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No academic sessions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isFormOpen && <SessionForm session={editingSession} onClose={() => setIsFormOpen(false)} />}
    </div>
  )
}
