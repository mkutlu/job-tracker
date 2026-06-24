"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Search } from "lucide-react"
import { Prisma } from "@prisma/client"
import { JobsTable } from "./jobs-table"
import { JobForm } from "./job-form"

type JobWithCompany = Prisma.JobGetPayload<{
  include: { company: { select: { name: true } } }
}>

type Props = {
  jobs: JobWithCompany[]
}

export function JobsClient({ jobs }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<JobWithCompany | null>(null)
  const [search, setSearch] = useState("")

  function openAdd() {
    setEditingJob(null)
    setFormOpen(true)
  }

  function openEdit(job: JobWithCompany) {
    setEditingJob(job)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingJob(null)
  }

  const filtered = search.trim()
    ? jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(search.toLowerCase()) ||
          j.company.name.toLowerCase().includes(search.toLowerCase())
      )
    : jobs

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Applications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {jobs.length} {jobs.length === 1 ? "application" : "applications"} tracked
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles, companies…"
              className="pl-8 pr-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-56"
            />
          </div>

          {/* Add button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={openAdd}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-3 sm:px-4 py-2 text-sm font-medium shadow-sm hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Add application</span>
          </motion.button>
        </div>
      </div>

      {/* Table */}
      <JobsTable jobs={filtered} onEdit={openEdit} onAdd={openAdd} />

      {/* Form drawer */}
      <JobForm open={formOpen} onClose={closeForm} job={editingJob} />
    </>
  )
}
