import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Placeholder for future school logo */}
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-bold text-2xl">ERP</span>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
