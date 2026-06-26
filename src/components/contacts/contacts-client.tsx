"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Users, Plus, Pencil, Trash2, Mail, Linkedin, Briefcase, Building2,
} from "lucide-react"
import { JobStatus } from "@prisma/client"
import { deleteContact } from "@/app/actions/contacts"
import { ContactForm } from "./contact-form"
import { JobStatusBadge } from "@/components/jobs/job-status-badge"

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

export function ContactsClient({
  contacts,
  companies,
  jobs,
}: {
  contacts: Contact[]
  companies: Company[]
  jobs: Job[]
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [search, setSearch] = useState("")

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.title ?? "").toLowerCase().includes(q) ||
      (c.company?.name ?? "").toLowerCase().includes(q)
    )
  })

  function handleAdd() {
    setEditingContact(null)
    setFormOpen(true)
  }

  function handleEdit(c: Contact) {
    setEditingContact(c)
    setFormOpen(true)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await deleteContact(id)
  }

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Contacts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recruiters, hiring managers, and referrals
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus size={15} />
          Add contact
        </button>
      </motion.div>

      {/* Search */}
      {contacts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, title, or company…"
            className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-colors"
          />
        </motion.div>
      )}

      {/* Empty state */}
      {contacts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mb-4">
            <Users size={28} className="text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No contacts yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Track recruiters, hiring managers, and anyone who can help your search.
          </p>
          <button
            onClick={handleAdd}
            className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Add your first contact
          </button>
        </motion.div>
      )}

      {/* No results */}
      {contacts.length > 0 && filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No contacts match "{search}"
        </p>
      )}

      {/* Card grid */}
      {filtered.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((contact, i) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="group border border-border bg-card p-5 flex flex-col gap-3 hover:border-primary/40 transition-colors"
            >
              {/* Name + actions */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground leading-tight">
                    {contact.name}
                  </p>
                  {contact.title && (
                    <p className="text-xs text-muted-foreground mt-0.5">{contact.title}</p>
                  )}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => handleEdit(contact)}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id, contact.name)}
                    className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Company + job association */}
              <div className="flex flex-col gap-1">
                {contact.company && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 size={11} className="shrink-0" />
                    <span className="truncate">{contact.company.name}</span>
                  </div>
                )}
                {contact.job && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Briefcase size={11} className="shrink-0" />
                    <span className="truncate flex-1">{contact.job.title}</span>
                    <JobStatusBadge status={contact.job.status} />
                  </div>
                )}
              </div>

              {/* Contact links */}
              <div className="flex items-center gap-2">
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium bg-accent text-muted-foreground border border-border hover:text-primary hover:border-primary/40 transition-colors truncate max-w-[160px]"
                    title={contact.email}
                  >
                    <Mail size={10} className="shrink-0" />
                    <span className="truncate">{contact.email}</span>
                  </a>
                )}
                {contact.linkedin && /^https?:\/\//i.test(contact.linkedin) && (
                  <a
                    href={contact.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium bg-accent text-muted-foreground border border-border hover:text-primary hover:border-primary/40 transition-colors shrink-0"
                  >
                    <Linkedin size={10} />
                    LinkedIn
                  </a>
                )}
              </div>

              {/* Notes */}
              {contact.notes && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {contact.notes}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <ContactForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        contact={editingContact}
        companies={companies}
        jobs={jobs}
      />
    </div>
  )
}
