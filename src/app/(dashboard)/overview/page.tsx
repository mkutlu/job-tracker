export default function OverviewPage() {
  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
      <p className="mt-1 text-sm text-slate-500">Your job search at a glance</p>

      {/* Stats placeholder */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Applied", value: "0" },
          { label: "In Progress", value: "0" },
          { label: "Interviews", value: "0" },
          { label: "Offers", value: "0" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent activity placeholder */}
      <div className="mt-8">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Recent Activity</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
          No activity yet. Start by adding a job application.
        </div>
      </div>
    </div>
  )
}
