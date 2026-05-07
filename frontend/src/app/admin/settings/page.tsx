'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Setting } from '@/types'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    numQuestions: 15,
    allowReview: true,
    timerEnabled: false,
    timerSeconds: 300,
  })

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await api.get<Setting>('/api/admin/settings')
      if (data) {
        setSettings(data)
        setFormData({
          numQuestions: data.numQuestions,
          allowReview: data.allowReview,
          timerEnabled: data.timerEnabled,
          timerSeconds: data.timerSeconds,
        })
      }
      setIsLoading(false)
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    const { error } = await api.put('/api/admin/settings', {
      numQuestions: formData.numQuestions,
      allowReview: formData.allowReview,
      timerEnabled: formData.timerEnabled,
      timerSeconds: formData.timerEnabled ? formData.timerSeconds : 0,
    })

    if (error) {
      toast.error(error)
    } else {
      toast.success('Settings saved successfully')
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Configuration</CardTitle>
            <CardDescription>
              Configure how the quiz behaves for participants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="numQuestions">Number of Questions</Label>
              <Input
                id="numQuestions"
                type="number"
                min={1}
                max={50}
                value={formData.numQuestions}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  numQuestions: Math.max(1, Math.min(50, parseInt(e.target.value) || 1))
                })}
              />
              <p className="text-sm text-slate-500">
                Number of questions shown in each quiz session (1-50)
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="allowReview"
                  checked={formData.allowReview}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    allowReview: checked as boolean
                  })}
                />
                <Label htmlFor="allowReview" className="cursor-pointer font-medium">
                  Allow Review
                </Label>
              </div>
              <p className="text-sm text-slate-500 ml-6">
                Allow participants to review their answers and explanations after completing the quiz
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="timerEnabled"
                  checked={formData.timerEnabled}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    timerEnabled: checked as boolean
                  })}
                />
                <Label htmlFor="timerEnabled" className="cursor-pointer font-medium">
                  Enable Timer
                </Label>
              </div>
              <p className="text-sm text-slate-500 ml-6">
                Set a time limit for completing the quiz
              </p>

              {formData.timerEnabled && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="timerDuration">Timer Duration (minutes)</Label>
                  <Input
                    id="timerDuration"
                    type="number"
                    min={1}
                    max={60}
                    value={Math.floor(formData.timerSeconds / 60)}
                    onChange={(e) => setFormData({
                      ...formData,
                      timerSeconds: Math.max(60, Math.min(3600, (parseInt(e.target.value) || 1) * 60))
                    })}
                    className="w-32"
                  />
                  <p className="text-sm text-slate-500">
                    Time limit in minutes (1-60 minutes)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}