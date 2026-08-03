import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function AcademicSettingsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Academic Settings & Locale</CardTitle>
          <CardDescription>
            Configure session start month, working days, timezone, and grading rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b pb-4">
            <div>
              <p className="text-xs text-muted-foreground">Session Start Month</p>
              <p className="font-semibold mt-1">April (Month 4)</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date Format</p>
              <p className="font-semibold font-mono text-xs mt-1">DD/MM/YYYY</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Time Zone</p>
              <p className="font-semibold text-xs mt-1">Asia/Kolkata (GMT+5:30)</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Configured Working Days</p>
            <div className="flex flex-wrap gap-2">
              {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map((day) => (
                <Badge key={day} variant="secondary">
                  {day}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
