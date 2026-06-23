import Link from "next/link"
import { Briefcase, Sparkles, BarChart2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header / Nav */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Briefcase size={20} className="text-primary" />
            <span>Job Tracker</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-primary-foreground bg-primary rounded-lg px-4 py-2"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center py-24 px-6">
        <h1 className="text-4xl font-semibold text-foreground mb-4">
          Your job search, organized
        </h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md">
          Track applications, analyze job descriptions, and land your next role.
        </p>
        <Link
          href="/login"
          className="bg-primary text-primary-foreground rounded-lg px-6 py-3 text-sm font-medium"
        >
          Get started
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <Briefcase size={22} className="text-primary mb-3" />
            <h3 className="text-foreground font-medium mb-1">Application tracking</h3>
            <p className="text-muted-foreground text-sm">
              List your applications and follow up at the right time.
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <Sparkles size={22} className="text-primary mb-3" />
            <h3 className="text-foreground font-medium mb-1">JD Analysis</h3>
            <p className="text-muted-foreground text-sm">
              Let AI parse job descriptions for key skills and requirements.
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <BarChart2 size={22} className="text-primary mb-3" />
            <h3 className="text-foreground font-medium mb-1">Pipeline view</h3>
            <p className="text-muted-foreground text-sm">
              See your progress at a glance across every stage.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">© 2025 Job Tracker</p>
      </footer>
    </div>
  )
}
