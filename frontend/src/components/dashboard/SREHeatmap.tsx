import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { HeatmapItem } from '@/features/dashboard/types'
import { useDashboardStore } from '@/features/dashboard/store/dashboardStore'

interface SREHeatmapProps {
  className?: string;
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

function getHealthColor(value: number): string {
  if (value >= 90) return 'text-emerald-500'
  if (value >= 70) return 'text-yellow-500'
  return 'text-red-500'
}

function getHealthBarColor(value: number): string {
  if (value >= 90) return 'bg-emerald-500'
  if (value >= 70) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getStatusDot(status: HeatmapItem['status']): string {
  switch (status) {
    case 'OK':
      return 'bg-emerald-500'
    case 'DEGRADED':
      return 'bg-yellow-500'
    case 'ERROR':
      return 'bg-red-500'
  }
}

export default function SREHeatmap({ className }: SREHeatmapProps) {
  const heatmapData = useDashboardStore((s) => s.heatmapData)

  if (!heatmapData || heatmapData.length === 0) return null

  return (
    <Card className={cn('glass border-border/50', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Service Health Heatmap</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          {heatmapData.map((item: HeatmapItem) => (
            <motion.div key={item.service} variants={cardVariants}>
              <Card className="glass border-border/50 p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {item.service}
                    </span>
                    <span
                      className={cn(
                        'inline-block w-2 h-2 rounded-full',
                        getStatusDot(item.status)
                      )}
                    />
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span
                      className={cn(
                        'text-2xl font-mono font-bold',
                        getHealthColor(item.health)
                      )}
                    >
                      {item.health}
                    </span>
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', getHealthBarColor(item.health))}
                      style={{ width: `${item.health}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                    <span>{item.latency}ms</span>
                    <span className={cn(item.errorRate > 1 && 'text-red-500 font-semibold')}>
                      {item.errorRate}% err
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  )
}
