"use client"

import { useState, useTransition } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { createContact, updateContact } from "@/app/actions/contacts"
import { cn } from "@/lib/utils"
import { JobStatus } from "@prisma/client"

type Company = { id: string; name: string }
type Job = { id: string; title: string; companyId: string; company: { name: string } }

type Contact = {
  id: string
  name: string
  title: string | null
  email: string | null
  linkedin: string | null
  notes: string | null
  companyId: string | null
  jobId: string | null
  company: { id: string; name: string } | null
  job: { id: string; title: string; status: JobStatus } | null
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors"

const selectClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors"

export function ContactForm({
  open,
  onClose,
  contact,
  companies,
  jobs,
}: {
  open: boolean
  onClose: () => void
  contact?: Contact | null
  companies: Company[]
  jobs: Job[]
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState(contact?.companyId ?? "")
  const isEdit = !!contact

  const filteredJobs = selectedCompanyId
    ? jobs.filter((j) => j.companyId === selectedCompanyId)
    : jobs

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = isEdit
        ? await updateContact(contact.id, formData)
        : await createContact(formData)
      if (result.success) {
        onClose()
      } else {
        setError(result.error ?? "Something went wrong")
      }
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-full w-full max-w-[440px] bg-card border-l border-border z-50 flex flex-col shadow-xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="text-base font-semibold text-foreground">
                {isEdit ? "Edit contact" : "Add contact"}
              </h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
              >
                <X size={18} />
              </button>
            </div>

            <form id="contact-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Full name *</label>
                <input
                  name="name"
                  required
                  defaultValue={contact?.name}
                  placeholder="e.g. Jane Smith"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Job title</label>
                <input
                  name="title"
                  defaultValue={contact?.title ?? ""}
                  placeholder="e.g. Engineering Manager"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Email</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={contact?.email ?? ""}
                    placeholder="jane@acme.com"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">LinkedIn</label>
                  <input
                    name="linkedin"
                    type="url"
                    defaultValue={contact?.linkedin ?? ""}
                    placeholder="https://linkedin.com/in/..."
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Company</label>
                <select
                  name="companyId"
                  defaultValue={contact?.companyId ?? ""}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">— None —</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">
                  Related job
                  {selectedCompanyId && filteredJobs.length === 0 && (
                    <span className="ml-1 text-muted-foreground/50">(no roles for this company)</span>
                  )}
                </label>
                <select
                  name="jobId"
                  defaultValue={contact?.jobId ?? ""}
                  className={selectClass}
                >
                  <option value="">— None —</option>
                  {filteredJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}{!selectedCompanyId ? ` @ ${j.company.name}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 pb-2">
                <label className="text-xs text-muted-foreground">Notes</label>
                <textarea
                  name="notes"
                  rows={4}
                  defaultValue={contact?.notes ?? ""}
                  placeholder="How you met, conversation topics, follow-up ideas…"
                  className={cn(inputClass, "resize-none")}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </form>

            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="contact-form"
                disabled={isPending}
                className="bg-primary text-primary-foreground rounded-lg px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPending ? "Saving…" : isEdit ? "Save changes" : "Add contact"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
