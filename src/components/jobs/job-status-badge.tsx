import { JobStatus } from "@prisma/client"
import { JOB_STATUS_CONFIG } from "@/lib/job-types"
import { cn } from "@/lib/utils"

export function JobStatusBadge({ status, className }: { status: JobStatus; className?: string }) {
  const { label, color } = JOB_STATUS_CONFIG[status]
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", color, className)}>
      {label}
    </span>
  )
}
