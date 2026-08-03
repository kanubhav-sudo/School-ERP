import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSubscription, submitUpgradeRequest } from '../subscription.api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Check, Sparkles, Clock, ShieldCheck, Zap, PhoneCall, CheckCircle2 } from 'lucide-react'

export function SubscriptionTab() {
  const queryClient = useQueryClient()
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [upgradeNotes, setUpgradeNotes] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['subscription'],
    queryFn: fetchSubscription,
  })

  const upgradeMutation = useMutation({
    mutationFn: () => submitUpgradeRequest('PREMIUM', upgradeNotes),
    onSuccess: () => {
      setIsUpgradeModalOpen(false)
      setSuccessMessage('Upgrade request submitted! You will receive a callback from the CloudEMS team shortly.')
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
    },
  })

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading subscription plan and pricing info...
      </div>
    )
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading subscription</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to retrieve subscription info.'}
        </AlertDescription>
      </Alert>
    )
  }

  const { subscription, catalog, hasPendingUpgradeRequest } = data
  const currentPlanCode = subscription.currentPlan.toUpperCase()
  const isBasePlan = currentPlanCode === 'BASE'
  const isPremiumPlan = currentPlanCode === 'PREMIUM'

  const baseCatalog = catalog['BASE']
  const premiumCatalog = catalog['PREMIUM']

  return (
    <div className="space-y-8">
      {/* Top Banner: Current Subscription Summary */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200 dark:border-indigo-900 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Current Active Subscription
            </span>
            <Badge variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {subscription.status}
            </Badge>
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {currentPlanCode === 'PREMIUM' ? 'Premium Plan' : 'Base Plan'}
          </h2>
          <p className="text-sm text-muted-foreground">
            School Pricing: ₹{subscription.monthlyPrice.toLocaleString('en-IN')}/month (or ₹
            {subscription.yearlyPrice.toLocaleString('en-IN')}/year)
          </p>
        </div>

        {hasPendingUpgradeRequest && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-lg text-sm font-medium">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>Upgrade Request Pending Callback</span>
          </div>
        )}
      </div>

      {/* Success Alert */}
      {successMessage && (
        <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Commercial Plan Comparison Cards */}
      <div>
        <h3 className="text-xl font-bold mb-2">Available SaaS Plans</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Compare commercial plans and features for CloudEMS school management.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ── BASE PLAN CARD ── */}
          <Card
            className={`flex flex-col relative transition-all ${
              isBasePlan ? 'border-2 border-primary shadow-md' : 'border'
            }`}
          >
            {isBasePlan && (
              <Badge className="absolute -top-3 left-6 px-3 py-1 bg-primary text-primary-foreground">
                Current Active Plan
              </Badge>
            )}
            <CardHeader className="pt-8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">Base Plan</CardTitle>
                <ShieldCheck className="w-6 h-6 text-indigo-500" />
              </div>
              <CardDescription>
                {baseCatalog?.description || 'Essential ERP tools for complete school management'}
              </CardDescription>

              {/* Pricing Display */}
              <div className="mt-4 pt-4 border-t space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold">₹1,000</span>
                  <span className="text-muted-foreground font-medium">/ month</span>
                </div>
                <div className="flex items-baseline gap-2 text-sm text-muted-foreground">
                  <span className="line-through text-muted-foreground/60">₹12,000/year</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹10,000/year
                  </span>
                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                    Save ₹2,000/yr
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Included Core Features:
              </div>
              <ul className="space-y-2 text-sm">
                {(baseCatalog?.features || []).map((feature) => (
                  <li key={feature.key} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">{feature.name}</span>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="pt-4 border-t">
              <Button
                variant={isBasePlan ? 'outline' : 'secondary'}
                className="w-full"
                disabled={isBasePlan}
              >
                {isBasePlan ? 'Active Plan' : 'Standard Included Plan'}
              </Button>
            </CardFooter>
          </Card>

          {/* ── PREMIUM PLAN CARD ── */}
          <Card
            className={`flex flex-col relative transition-all bg-gradient-to-b from-card to-purple-500/5 ${
              isPremiumPlan
                ? 'border-2 border-purple-600 shadow-lg'
                : 'border-2 border-purple-500/40 shadow-sm hover:border-purple-500'
            }`}
          >
            {isPremiumPlan && (
              <Badge className="absolute -top-3 left-6 px-3 py-1 bg-purple-600 text-white">
                Current Active Plan
              </Badge>
            )}
            <CardHeader className="pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl font-bold">Premium Plan</CardTitle>
                  <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                </div>
                <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                  Recommended
                </Badge>
              </div>
              <CardDescription>
                {premiumCatalog?.description ||
                  'Advanced AI insights, transport tracking, and automated workflows'}
              </CardDescription>

              {/* Pricing Display */}
              <div className="mt-4 pt-4 border-t space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                    ₹2,500
                  </span>
                  <span className="text-muted-foreground font-medium">/ month</span>
                </div>
                <div className="flex items-baseline gap-2 text-sm text-muted-foreground">
                  <span className="line-through text-muted-foreground/60">₹30,000/year</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    ₹25,000/year
                  </span>
                  <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
                    Save ₹5,000/yr
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Everything in Base Plan, Plus Premium Modules:
              </div>

              {/* Dynamic Feature List coming from backend catalog configuration */}
              <ul className="space-y-3 text-sm">
                {(premiumCatalog?.features || [])
                  .filter((f) => f.category === 'PREMIUM')
                  .map((feature) => (
                    <li key={feature.key} className="flex items-start gap-2.5">
                      <div className="p-1 rounded bg-purple-500/10 text-purple-600 mt-0.5 shrink-0">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{feature.name}</span>
                          {feature.isPlaceholder && (
                            <Badge variant="outline" className="text-[10px] py-0 h-4 border-purple-200 text-purple-600">
                              Upcoming
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </li>
                  ))}
                <li className="flex items-center gap-2 text-xs italic text-purple-600 dark:text-purple-400 pt-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>More Premium Features Coming Soon</span>
                </li>
              </ul>
            </CardContent>

            <CardFooter className="pt-4 border-t">
              {isPremiumPlan ? (
                <Button className="w-full bg-purple-600 text-white hover:bg-purple-700" disabled>
                  Current Active Plan
                </Button>
              ) : hasPendingUpgradeRequest ? (
                <Button variant="outline" className="w-full border-amber-400 text-amber-600" disabled>
                  <Clock className="w-4 h-4 mr-2" />
                  Upgrade Request Pending
                </Button>
              ) : (
                <Button
                  className="w-full bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg transition-all"
                  onClick={() => setIsUpgradeModalOpen(true)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Request Upgrade
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* ── UPGRADE CONFIRMATION DIALOG ── */}
      <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300">
                <PhoneCall className="w-5 h-5" />
              </div>
              <DialogTitle className="text-xl">Upgrade to Premium?</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-sm text-muted-foreground">
              You will receive a callback from the CloudEMS team shortly to complete your subscription upgrade and enable premium features.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-foreground">What happens next?</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Our team verifies your school account and requirements</li>
                <li>Custom pricing and billing options will be discussed</li>
                <li>Premium features are activated immediately upon confirmation</li>
              </ul>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Additional Notes or Preferred Time (Optional)
              </label>
              <textarea
                className="w-full text-sm p-2 rounded-md border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
                rows={3}
                placeholder="e.g. Please call between 2 PM - 4 PM..."
                value={upgradeNotes}
                onChange={(e) => setUpgradeNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUpgradeModalOpen(false)}
              disabled={upgradeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-purple-600 text-white hover:bg-purple-700"
              onClick={() => upgradeMutation.mutate()}
              disabled={upgradeMutation.isPending}
            >
              {upgradeMutation.isPending ? 'Submitting...' : 'Request Upgrade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
