export default function JobsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Jobs</h1>
          <p className="mt-1 text-sm text-slate-500">Track your job applications</p>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
          + Add Job
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
        No jobs yet. Add your first application to get started.
      </div>
    </div>
  )
}
