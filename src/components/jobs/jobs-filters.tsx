"use client"

import { JobStatus, Priority, JobSource, LocationType } from "@prisma/client"
import { ChevronDown, Filter, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { JOB_STATUS_CONFIG, SOURCE_LABELS, LOCATION_LABELS } from "@/lib/job-types"

export type FilterState = {
  statuses: JobStatus[]
  priorities: Priority[]
  locationTypes: LocationType[]
  sources: JobSource[]
  minExcitement: number | null
  days: number | null
}

export const EMPTY_FILTERS: FilterState = {
  statuses: [],
  priorities: [],
  locationTypes: [],
  sources: [],
  minExcitement: null,
  days: null,
}

const ALL_STATUSES = Object.keys(JOB_STATUS_CONFIG) as JobStatus[]
const PRIORITY_LABELS: Record<Priority, string> = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" }

type Props = {
  filters: FilterState
  onChange: (f: FilterState) => void
  totalCount: number
  filteredCount: number
}

// ── Small helpers ──────────────────────────────────────────────

function PanelSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  )
}

function CheckRow({
  checked,
  label,
  radio = false,
  onChange,
}: {
  checked: boolean
  label: string
  radio?: boolean
  onChange: () => void
}) {
  return (
    <label onClick={onChange} className="flex items-center gap-2 cursor-pointer group">
      <span
        className={cn(
          "w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0",
          radio && "rounded-full",
          checked
            ? "bg-primary border-primary"
            : "border-border group-hover:border-ring bg-background"
        )}
      >
        {checked && (
          <span className={cn("bg-primary-foreground", radio ? "w-1.5 h-1.5 rounded-full" : "w-2 h-2 block")}
            style={radio ? {} : { clipPath: "polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)" }}
          />
        )}
      </span>
      <span className="text-xs text-foreground">{label}</span>
    </label>
  )
}

// ── Filter panel dropdown ──────────────────────────────────────

type PanelProps = {
  filters: FilterState
  onTogglePriority: (p: Priority) => void
  onToggleLocationType: (l: LocationType) => void
  onToggleSource: (s: JobSource) => void
  onMinExcitement: (v: number | null) => void
  onDays: (v: number | null) => void
}

function FilterPanel({ filters, onTogglePriority, onToggleLocationType, onToggleSource, onMinExcitement, onDays }: PanelProps) {
  return (
    <div data-testid="filter-panel" className="absolute top-full mt-1.5 right-0 z-30 w-56 rounded-xl border border-border bg-card shadow-xl p-4 flex flex-col gap-4">

      <PanelSection label="Priority">
        {(["HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => (
          <CheckRow
            key={p}
            checked={filters.priorities.includes(p)}
            label={PRIORITY_LABELS[p]}
            onChange={() => onTogglePriority(p)}
          />
        ))}
      </PanelSection>

      <div className="border-t border-border" />

      <PanelSection label="Location">
        {(["REMOTE", "HYBRID", "ONSITE"] as LocationType[]).map((l) => (
          <CheckRow
            key={l}
            checked={filters.locationTypes.includes(l)}
            label={LOCATION_LABELS[l]}
            onChange={() => onToggleLocationType(l)}
          />
        ))}
      </PanelSection>

      <div className="border-t border-border" />

      <PanelSection label="Source">
        {(Object.keys(SOURCE_LABELS) as JobSource[]).map((s) => (
          <CheckRow
            key={s}
            checked={filters.sources.includes(s)}
            label={SOURCE_LABELS[s]}
            onChange={() => onToggleSource(s)}
          />
        ))}
      </PanelSection>

      <div className="border-t border-border" />

      <PanelSection label="Min. excitement">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onMinExcitement(filters.minExcitement === n ? null : n)}
              className={cn(
                "text-xl leading-none transition-colors",
                n <= (filters.minExcitement ?? 0) ? "text-amber-400" : "text-muted-foreground/20 hover:text-amber-300"
              )}
            >
              ★
            </button>
          ))}
        </div>
      </PanelSection>

      <div className="border-t border-border" />

      <PanelSection label="Date added">
        {([30, 60, 90] as const).map((d) => (
          <CheckRow
            key={d}
            checked={filters.days === d}
            label={`Last ${d} days`}
            radio
            onChange={() => onDays(filters.days === d ? null : d)}
          />
        ))}
      </PanelSection>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────

export function JobsFilters({ filters, onChange, totalCount, filteredCount }: Props) {
  const [panelOpen, setPanelOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const nonStatusCount = [
    filters.priorities.length > 0,
    filters.locationTypes.length > 0,
    filters.sources.length > 0,
    filters.minExcitement !== null,
    filters.days !== null,
  ].filter(Boolean).length

  const hasAnyFilter = filters.statuses.length > 0 || nonStatusCount > 0

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPanelOpen(false)
      }
    }
    if (panelOpen) document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [panelOpen])

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]
  }

  const activeChips: { label: string; clear: () => void }[] = [
    ...filters.priorities.map((p) => ({
      label: `Priority: ${PRIORITY_LABELS[p]}`,
      clear: () => onChange({ ...filters, priorities: filters.priorities.filter((x) => x !== p) }),
    })),
    ...filters.locationTypes.map((l) => ({
      label: LOCATION_LABELS[l],
      clear: () => onChange({ ...filters, locationTypes: filters.locationTypes.filter((x) => x !== l) }),
    })),
    ...filters.sources.map((s) => ({
      label: SOURCE_LABELS[s],
      clear: () => onChange({ ...filters, sources: filters.sources.filter((x) => x !== s) }),
    })),
    ...(filters.minExcitement !== null
      ? [{ label: `★ ${filters.minExcitement}+`, clear: () => onChange({ ...filters, minExcitement: null }) }]
      : []),
    ...(filters.days !== null
      ? [{ label: `Last ${filters.days} days`, clear: () => onChange({ ...filters, days: null }) }]
      : []),
  ]

  return (
    <div className="flex flex-col gap-2 mb-5">
      {/* Status chips + Filters button row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {ALL_STATUSES.map((s) => {
          const active = filters.statuses.includes(s)
          return (
            <button
              key={s}
              onClick={() => onChange({ ...filters, statuses: toggle(filters.statuses, s) })}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-ring hover:text-foreground"
              )}
            >
              {JOB_STATUS_CONFIG[s].label}
            </button>
          )
        })}

        <div className="w-px h-4 bg-border mx-0.5 shrink-0" />

        {/* Filters dropdown trigger */}
        <div className="relative" ref={containerRef}>
          <button
            onClick={() => setPanelOpen((o) => !o)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              panelOpen || nonStatusCount > 0
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-ring hover:text-foreground"
            )}
          >
            <Filter size={11} />
            Filters
            {nonStatusCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center">
                {nonStatusCount}
              </span>
            )}
            <ChevronDown size={11} className={cn("transition-transform", panelOpen && "rotate-180")} />
          </button>

          {panelOpen && (
            <FilterPanel
              filters={filters}
              onTogglePriority={(p) => onChange({ ...filters, priorities: toggle(filters.priorities, p) })}
              onToggleLocationType={(l) => onChange({ ...filters, locationTypes: toggle(filters.locationTypes, l) })}
              onToggleSource={(s) => onChange({ ...filters, sources: toggle(filters.sources, s) })}
              onMinExcitement={(v) => onChange({ ...filters, minExcitement: v })}
              onDays={(v) => onChange({ ...filters, days: v })}
            />
          )}
        </div>

        {hasAnyFilter && (
          <button
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Active non-status chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeChips.map((chip) => (
            <span
              key={chip.label}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent text-xs text-foreground border border-border"
            >
              {chip.label}
              <button onClick={chip.clear} className="text-muted-foreground hover:text-foreground">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Result count when filtered */}
      {hasAnyFilter && filteredCount !== totalCount && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredCount} of {totalCount} applications
        </p>
      )}
    </div>
  )
}