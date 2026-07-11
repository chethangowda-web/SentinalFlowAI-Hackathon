import { motion } from 'framer-motion'
import {
  DollarSign,
  ShieldCheck,
  Ban,
  Clock,
  Eye,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ExecutiveKPI } from '@/features/dashboard/types'
import { useDashboardStore } from '@/features/dashboard/store/dashboardStore'

const iconMap: Record<string, React.ElementType> = {
  DollarSign,
  ShieldCheck,
  Ban,
  Clock,
  Eye,
  Target,
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

export default function ExecutiveKPIs() {
  const executiveKPIs = useDashboardStore((s) => s.executiveKPIs)

  if (!executiveKPIs || executiveKPIs.length === 0) return null

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
    >
      {executiveKPIs.map((kpi: ExecutiveKPI) => {
        const Icon = iconMap[kpi.icon]
        const trendIsUp = kpi.trendDirection === 'up'
        const trendIsDown = kpi.trendDirection === 'down'
        const trendIsNeutral = kpi.trendDirection === 'neutral'

        return (
          <motion.div key={kpi.label} variants={cardVariants}>
            <Card
              className={cn(
                'glass relative overflow-hidden border-border/50',
                'hover:border-primary/20 transition-all duration-200'
              )}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ background: kpi.color }}
              />
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${kpi.color}20` }}
                  >
                    {Icon && <Icon className="w-4 h-4" color={kpi.color} />}
                  </div>

                  {trendIsUp && (
                    <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] font-semibold text-emerald-500">
                        +{kpi.trend}%
                      </span>
                    </div>
                  )}
                  {trendIsDown && (
                    <div className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5">
                      <TrendingDown className="w-3 h-3 text-red-500" />
                      <span className="text-[10px] font-semibold text-red-500">
                        {kpi.trend}%
                      </span>
                    </div>
                  )}
                  {trendIsNeutral && (
                    <div className="flex items-center gap-1 rounded-full bg-muted/30 px-2 py-0.5">
                      <Minus className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {kpi.trend}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                    {kpi.label}
                  </p>
                  <p className="text-2xl font-bold font-mono tracking-tight text-foreground">
                    {kpi.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground">vs last period</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
