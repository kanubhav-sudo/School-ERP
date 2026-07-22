import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchExamTemplate, saveExamTemplate } from '../api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Save } from 'lucide-react'

interface Props {
  type: 'ADMIT_CARD' | 'RESULT'
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExamTemplateModal({ type, open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const [schoolName, setSchoolName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [headerText, setHeaderText] = useState('')
  const [footerText, setFooterText] = useState('')
  const [principalSignatureUrl, setPrincipalSignatureUrl] = useState('')
  const [schoolStampUrl, setSchoolStampUrl] = useState('')

  const { data: template, isLoading } = useQuery({
    queryKey: ['exam-template', type],
    queryFn: () => fetchExamTemplate(type),
    enabled: open,
  })

  useEffect(() => {
    if (template) {
      setSchoolName(template.schoolName || '')
      setLogoUrl(template.logoUrl || '')
      setHeaderText(template.headerText || '')
      setFooterText(template.footerText || '')
      setPrincipalSignatureUrl(template.principalSignatureUrl || '')
      setSchoolStampUrl(template.schoolStampUrl || '')
    }
  }, [template])

  const saveMutation = useMutation({
    mutationFn: (payload: any) => saveExamTemplate(type, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-template', type] })
      onOpenChange(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate({
      schoolName,
      logoUrl,
      headerText,
      footerText,
      principalSignatureUrl,
      schoolStampUrl,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configure {type === 'ADMIT_CARD' ? 'Admit Card' : 'Result Card'} Template
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Loading template config...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">School Name</Label>
              <Input
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. School ERP Academy"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Header Text / Document Title</Label>
              <Input
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                placeholder={type === 'ADMIT_CARD' ? 'EXAMINATION ADMIT CARD' : 'ANNUAL PROGRESS REPORT'}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">School Logo URL</Label>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://... logo image URL"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Principal Signature URL</Label>
                <Input
                  value={principalSignatureUrl}
                  onChange={(e) => setPrincipalSignatureUrl(e.target.value)}
                  placeholder="https://... signature URL"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">School Stamp URL</Label>
                <Input
                  value={schoolStampUrl}
                  onChange={(e) => setSchoolStampUrl(e.target.value)}
                  placeholder="https://... stamp URL"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Footer / Verification Text</Label>
              <Input
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="This document is computer generated."
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                <Save className="h-4 w-4 mr-1.5" />
                {saveMutation.isPending ? 'Saving...' : 'Save Template'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
