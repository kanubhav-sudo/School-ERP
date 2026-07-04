import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-4xl font-bold text-destructive">403</h1>
        <h2 className="text-2xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to view this page. Please return to your portal or contact your
          administrator if you believe this is an error.
        </p>
        <Button>
          <Link to="/">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
