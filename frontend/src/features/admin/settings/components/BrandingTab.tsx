import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function BrandingTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Branding & Visual Customization</CardTitle>
          <CardDescription>
            Customize your school logo, primary theme color, and header assets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-4 border-b pb-4">
            <div className="w-16 h-16 rounded-lg bg-indigo-600/10 border border-indigo-200 flex items-center justify-center font-bold text-indigo-600 text-xl">
              LOGO
            </div>
            <div>
              <p className="font-semibold">Official School Logo</p>
              <p className="text-xs text-muted-foreground">Appears on document templates, admit cards, and report cards.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Primary Theme Color</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-4 h-4 rounded-full bg-indigo-600 border" />
                  <span className="font-mono text-xs font-semibold">#4F46E5</span>
                </div>
              </div>
              <Badge variant="outline">Default</Badge>
            </div>

            <div className="p-3 border rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Accent Theme Color</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-4 h-4 rounded-full bg-cyan-500 border" />
                  <span className="font-mono text-xs font-semibold">#06B6D4</span>
                </div>
              </div>
              <Badge variant="outline">Default</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
