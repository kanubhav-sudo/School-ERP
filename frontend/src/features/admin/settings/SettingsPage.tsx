import { useSearchParams } from 'react-router-dom'
import { GeneralTab } from './components/GeneralTab'
import { SchoolProfileTab } from './components/SchoolProfileTab'
import { BrandingTab } from './components/BrandingTab'
import { AcademicSettingsTab } from './components/AcademicSettingsTab'
import { SubscriptionTab } from './components/SubscriptionTab'
import { SecurityTab } from './components/SecurityTab'
import { Settings, Building2, Palette, GraduationCap, CreditCard, Shield } from 'lucide-react'

type TabKey = 'general' | 'profile' | 'branding' | 'academic' | 'subscription' | 'security'

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'general', label: 'General', icon: Settings },
  { key: 'profile', label: 'School Profile', icon: Building2 },
  { key: 'branding', label: 'Branding', icon: Palette },
  { key: 'academic', label: 'Academic Settings', icon: GraduationCap },
  { key: 'subscription', label: 'Subscription', icon: CreditCard },
  { key: 'security', label: 'Security', icon: Shield },
]

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as TabKey | null

  const activeTab: TabKey =
    tabParam && TABS.some((t) => t.key === tabParam) ? tabParam : 'subscription'

  const handleTabChange = (key: TabKey) => {
    setSearchParams({ tab: key })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            School Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage school profile, branding, academic configuration, commercial subscription, and security.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b overflow-x-auto pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          const isSubTab = tab.key === 'subscription'

          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span>{tab.label}</span>
              {isSubTab && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'profile' && <SchoolProfileTab />}
        {activeTab === 'branding' && <BrandingTab />}
        {activeTab === 'academic' && <AcademicSettingsTab />}
        {activeTab === 'subscription' && <SubscriptionTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  )
}
