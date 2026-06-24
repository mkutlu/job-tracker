import { getJobs } from "@/app/actions/jobs"
import { JobsClient } from "@/components/jobs/jobs-client"

export default async function JobsPage() {
  const jobs = await getJobs()

  return (
    <div className="p-8">
      <JobsClient jobs={jobs} />
    </div>
  )
}
