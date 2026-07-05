import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Copy, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

interface CredentialDisplayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  username: string
  temporaryPassword?: string
  title?: string
  description?: string
}

export function CredentialDisplayDialog({
  open,
  onOpenChange,
  username,
  temporaryPassword,
  title = 'Account Credentials',
  description = 'Please securely share these credentials with the user. The password will only be shown this once.',
}: CredentialDisplayDialogProps) {
  const [copiedUname, setCopiedUname] = useState(false)
  const [copiedPass, setCopiedPass] = useState(false)

  const copyToClipboard = async (text: string, type: 'username' | 'password') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'username') {
        setCopiedUname(true)
        setTimeout(() => setCopiedUname(false), 2000)
      } else {
        setCopiedPass(true)
        setTimeout(() => setCopiedPass(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-destructive flex items-center gap-2 mt-2 font-medium">
            <AlertTriangle className="h-4 w-4" />
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex items-center gap-2">
              <Input id="username" value={username} readOnly className="font-mono bg-muted" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(username, 'username')}
              >
                {copiedUname ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {temporaryPassword && (
            <div className="space-y-2">
              <Label htmlFor="password">Temporary Password</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="password"
                  value={temporaryPassword}
                  readOnly
                  className="font-mono bg-muted"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(temporaryPassword, 'password')}
                >
                  {copiedPass ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-start">
          <Button type="button" variant="default" onClick={() => onOpenChange(false)}>
            I have saved these credentials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
