"use client"

import { useTransition } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { createCompany, updateCompany } from "@/app/actions/companies"
import { cn } from "@/lib/utils"
import { useState } from "react"

type Company = {
  id: string
  name: string
  website: string | null
  industry: string | null
  size: string | null
  notes: string | null
}

const SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"]

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors"

const selectClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors"

export function CompanyForm({
  open,
  onClose,
  company,
}: {
  open: boolean
  onClose: () => void
  company?: Company | null
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!company

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = isEdit
        ? await updateCompany(company.id, formData)
        : await createCompany(formData)
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
                {isEdit ? "Edit company" : "Add company"}
              </h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
              >
                <X size={18} />
              </button>
            </div>

            <form id="company-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Company name *</label>
                <input
                  name="name"
                  required
                  defaultValue={company?.name}
                  placeholder="e.g. Acme Corp"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Website</label>
                <input
                  name="website"
                  type="url"
                  defaultValue={company?.website ?? ""}
                  placeholder="https://acme.com"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Industry</label>
                  <input
                    name="industry"
                    defaultValue={company?.industry ?? ""}
                    placeholder="e.g. SaaS, Fintech"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground">Company size</label>
                  <select name="size" defaultValue={company?.size ?? ""} className={selectClass}>
                    <option value="">—</option>
                    {SIZES.map((s) => (
                      <option key={s} value={s}>{s} employees</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pb-2">
                <label className="text-xs text-muted-foreground">Notes</label>
                <textarea
                  name="notes"
                  rows={4}
                  defaultValue={company?.notes ?? ""}
                  placeholder="Culture notes, referrals, anything worth remembering…"
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
                form="company-form"
                disabled={isPending}
                className="bg-primary text-primary-foreground rounded-lg px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPending ? "Saving…" : isEdit ? "Save changes" : "Add company"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
