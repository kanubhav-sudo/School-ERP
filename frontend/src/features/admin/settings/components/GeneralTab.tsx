import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTenant } from '@/context/TenantContext'

export function GeneralTab() {
  const { schoolSlug } = useTenant()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General System Settings</CardTitle>
          <CardDescription>
            Overview of tenant instance configuration and system status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
            <div>
              <p className="text-xs text-muted-foreground">School Tenant Domain / Slug</p>
              <p className="font-semibold">{schoolSlug || 'Default School'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tenant Identifier</p>
              <p className="font-semibold font-mono text-xs">{schoolSlug || 'default'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
            <div>
              <p className="text-xs text-muted-foreground">Account Status</p>
              <Badge variant="default" className="mt-1">
                ACTIVE
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Platform Engine</p>
              <p className="font-semibold text-xs">CloudEMS SaaS v4.5</p>
            </div>
          </div>

          <div className="pt-2 text-xs text-muted-foreground">
            For technical support or tenant configuration adjustments, contact your CloudEMS platform administrator.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
