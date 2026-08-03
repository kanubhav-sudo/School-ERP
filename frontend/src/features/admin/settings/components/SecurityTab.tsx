import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, KeyRound, History } from 'lucide-react'

export function SecurityTab() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security & Password Management</CardTitle>
          <CardDescription>
            Manage account security credentials and security audit logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Account Password</p>
                <p className="text-xs text-muted-foreground">Change your admin account password</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/change-password')}>
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                <History className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Security Audit Log</p>
                <p className="text-xs text-muted-foreground">Review login history and security events</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/accounts')}>
              View Account Audits
            </Button>
          </div>

          <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Multi-factor authentication (MFA) enforcement can be enabled via CloudEMS platform settings.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
