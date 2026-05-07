import { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <Card className="p-6 border-gray-300">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
          <Icon className="h-6 w-6 text-gray-700" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  )
}