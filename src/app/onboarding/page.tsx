"use client"

import { useTransition } from "react"
import { Briefcase } from "lucide-react"
import { saveProfile } from "@/app/actions/profile"

const statusOptions = [
  { value: "EMPLOYED",   label: "Currently employed" },
  { value: "UNEMPLOYED", label: "Not currently working" },
  { value: "FREELANCE",  label: "Freelancing / Contracting" },
  { value: "STUDENT",    label: "Student" },
]

const inputClass =
  "border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"

export default function OnboardingPage() {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => saveProfile(formData))
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-xl shadow-sm p-8 max-w-sm w-full">
        <div className="flex flex-col items-center gap-2 mb-7">
          <Briefcase className="text-primary" size={28} />
          <h1 className="text-xl font-semibold text-foreground">Welcome aboard</h1>
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            A few quick details to set up your profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">First name</label>
              <input name="firstName" required autoFocus className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Last name</label>
              <input name="lastName" required className={inputClass} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Current status</label>
            <select name="jobStatus" required defaultValue="" className={inputClass}>
              <option value="" disabled>Select a status…</option>
              {statusOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Current title{" "}
              <span className="text-muted-foreground/50 font-normal">— optional</span>
            </label>
            <input
              name="currentTitle"
              placeholder="e.g. Senior Software Engineer"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 mt-1"
          >
            {isPending ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  )
}
