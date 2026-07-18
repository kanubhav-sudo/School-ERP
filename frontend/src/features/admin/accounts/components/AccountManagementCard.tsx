import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountApi } from '../api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CredentialDisplayDialog } from './CredentialDisplayDialog'
import { format } from 'date-fns'

interface AccountManagementCardProps {
  userId: string | null | undefined
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
  ARCHIVED: 'bg-red-100 text-red-700',
}

export function AccountManagementCard({ userId }: AccountManagementCardProps) {
  const queryClient = useQueryClient()
  const [credentials, setCredentials] = useState<{
    username: string
    temporaryPassword?: string
  } | null>(null)

  const {
    data: account,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['account', userId],
    queryFn: () => accountApi.getDetails(userId!),
    enabled: !!userId,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['account', userId] })

  const onError = (error: any) => {
    alert(error?.response?.data?.error?.message || error?.message || 'An error occurred')
  }

  const resetPassword = useMutation({
    mutationFn: () => accountApi.resetPassword(userId!),
    onSuccess: (data) => {
      setCredentials({ username: account!.username, temporaryPassword: data.temporaryPassword })
      invalidate()
    },
    onError,
  })

  const reissueCredentials = useMutation({
    mutationFn: () => accountApi.reissueCredentials(userId!),
    onSuccess: (data) => {
      setCredentials({ username: account!.username, temporaryPassword: data.temporaryPassword })
      invalidate()
    },
    onError,
  })

  const activate = useMutation({
    mutationFn: () => accountApi.activateAccount(userId!),
    onSuccess: () => invalidate(),
    onError,
  })

  const suspend = useMutation({
    mutationFn: () => accountApi.suspendAccount(userId!),
    onSuccess: () => invalidate(),
    onError,
  })

  const disable = useMutation({
    mutationFn: () => accountApi.disableAccount(userId!),
    onSuccess: () => invalidate(),
    onError,
  })

  const forcePasswordChange = useMutation({
    mutationFn: () => accountApi.forcePasswordChange(userId!),
    onSuccess: () => invalidate(),
    onError,
  })

  const unlock = useMutation({
    mutationFn: () => accountApi.unlockAccount(userId!),
    onSuccess: () => invalidate(),
    onError,
  })

  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>No user account exists for this profile yet.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isLoading)
    return (
      <Card>
        <CardContent className="pt-6">Loading account details...</CardContent>
      </Card>
    )
  if (error || !account)
    return (
      <Card>
        <CardContent className="pt-6 text-red-500">Failed to load account details.</CardContent>
      </Card>
    )

  const isLocked = account.lockedUntil && new Date(account.lockedUntil) > new Date()

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Account Management</CardTitle>
            <CardDescription>Manage user credentials and access state</CardDescription>
          </div>
          <Badge className={STATUS_COLORS[account.accountStatus] || 'bg-gray-100'}>
            {account.accountStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Username</p>
            <p className="font-mono font-medium">{account.username}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Role</p>
            <p className="font-medium">{account.role}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Failed Login Attempts</p>
            <p className="font-medium">{account.failedLoginAttempts}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Last Login</p>
            <p className="font-medium">
              {account.lastLoginAt ? format(new Date(account.lastLoginAt), 'PPp') : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Must Change Password</p>
            <p className="font-medium">{account.mustChangePassword ? 'Yes' : 'No'}</p>
          </div>
          {isLocked && (
            <div className="col-span-2 text-red-600 font-medium bg-red-50 p-2 rounded">
              Account is locked until {format(new Date(account.lockedUntil!), 'PPp')}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {account.accountStatus === 'ACTIVE' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => suspend.mutate()}
                disabled={suspend.isPending}
              >
                Suspend
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => disable.mutate()}
                disabled={disable.isPending}
              >
                Disable
              </Button>
            </>
          )}
          {(account.accountStatus === 'INACTIVE' || account.accountStatus === 'SUSPENDED') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => activate.mutate()}
              disabled={activate.isPending}
            >
              Activate
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => resetPassword.mutate()}
            disabled={resetPassword.isPending}
          >
            Reset Password
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => reissueCredentials.mutate()}
            disabled={reissueCredentials.isPending}
          >
            Reissue Credentials
          </Button>

          {!account.mustChangePassword && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => forcePasswordChange.mutate()}
              disabled={forcePasswordChange.isPending}
            >
              Force Password Change
            </Button>
          )}

          {isLocked && (
            <Button
              size="sm"
              variant="default"
              onClick={() => unlock.mutate()}
              disabled={unlock.isPending}
            >
              Unlock Account
            </Button>
          )}
        </div>

        {account.accountAuditLogs && account.accountAuditLogs.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-semibold mb-2">Recent Activity</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {account.accountAuditLogs.map(
                (log: {
                  id: string
                  action: string
                  actor?: { username: string }
                  remarks?: string
                  createdAt: string
                }) => (
                  <div key={log.id} className="text-xs flex justify-between p-2 bg-muted rounded">
                    <span>
                      <span className="font-semibold">{log.action}</span>
                      {log.actor ? ` by ${log.actor.username}` : ' (System)'}
                      {log.remarks && ` - ${log.remarks}`}
                    </span>
                    <span className="text-muted-foreground whitespace-nowrap ml-4">
                      {format(new Date(log.createdAt), 'MMM d, p')}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CredentialDisplayDialog
        open={!!credentials}
        onOpenChange={(open) => !open && setCredentials(null)}
        username={credentials?.username ?? ''}
        temporaryPassword={credentials?.temporaryPassword}
        title="Credentials Generated"
        description="A new temporary password has been generated. Please provide it to the user."
      />
    </Card>
  )
}
