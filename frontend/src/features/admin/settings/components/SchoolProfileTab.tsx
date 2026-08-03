import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { useTenant } from '@/context/TenantContext'

export function SchoolProfileTab() {
  const { schoolSlug } = useTenant()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>School Profile</CardTitle>
          <CardDescription>
            Official contact, address, and institutional metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
            <div>
              <p className="text-xs text-muted-foreground">Institutional Name</p>
              <p className="font-semibold">{schoolSlug ? `${schoolSlug.toUpperCase()} High School` : 'CloudEMS School'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tenant Slug / Subdomain</p>
              <p className="font-semibold">{schoolSlug || 'default'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
            <div>
              <p className="text-xs text-muted-foreground">Contact Email</p>
              <p className="font-semibold">admin@{schoolSlug || 'school'}.com</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contact Phone</p>
              <p className="font-semibold">+91 9876543210</p>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-1">Address &amp; Location</p>
            <p className="font-medium text-foreground">
              Main Campus, City, State, India
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
