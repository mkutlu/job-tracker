import React from "react"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { JobsFilters, FilterState, EMPTY_FILTERS } from "../jobs-filters"

const baseFilters: FilterState = { ...EMPTY_FILTERS }

function renderFilters(filters: FilterState = baseFilters, overrides: Partial<{ totalCount: number; filteredCount: number }> = {}) {
  const onChange = jest.fn()
  const { rerender } = render(
    <JobsFilters
      filters={filters}
      onChange={onChange}
      totalCount={overrides.totalCount ?? 10}
      filteredCount={overrides.filteredCount ?? 10}
    />
  )
  return { onChange, rerender }
}

// ── Status chips ───────────────────────────────────────────────

describe("JobsFilters — status chips", () => {
  it("renders a chip for every job status", () => {
    renderFilters()
    const expectedLabels = [
      "Bookmarked", "Applying", "Applied", "Phone Screen",
      "Interview", "Technical", "Offer", "Accepted", "Rejected", "Withdrawn",
    ]
    expectedLabels.forEach((label) => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument()
    })
  })

  it("calls onChange with the status toggled on when an inactive chip is clicked", () => {
    const { onChange } = renderFilters()
    fireEvent.click(screen.getByRole("button", { name: "Applied" }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ statuses: ["APPLIED"] })
    )
  })

  it("calls onChange with the status toggled off when an active chip is clicked", () => {
    const { onChange } = renderFilters({ ...baseFilters, statuses: ["APPLIED"] })
    fireEvent.click(screen.getByRole("button", { name: "Applied" }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ statuses: [] })
    )
  })

  it("adds to an existing statuses selection without removing others", () => {
    const { onChange } = renderFilters({ ...baseFilters, statuses: ["APPLIED"] })
    fireEvent.click(screen.getByRole("button", { name: "Offer" }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ statuses: ["APPLIED", "OFFER"] })
    )
  })
})

// ── Filters panel ──────────────────────────────────────────────

describe("JobsFilters — Filters panel", () => {
  it("renders the Filters button", () => {
    renderFilters()
    expect(screen.getByRole("button", { name: /Filters/i })).toBeInTheDocument()
  })

  it("panel is hidden by default", () => {
    renderFilters()
    expect(screen.queryByText("Priority")).not.toBeInTheDocument()
  })

  it("opens the panel when Filters button is clicked", () => {
    renderFilters()
    fireEvent.click(screen.getByRole("button", { name: /Filters/i }))
    expect(screen.getByText("Priority")).toBeInTheDocument()
    expect(screen.getByText("Location")).toBeInTheDocument()
    expect(screen.getByText("Source")).toBeInTheDocument()
    expect(screen.getByText("Min. excitement")).toBeInTheDocument()
    expect(screen.getByText("Date added")).toBeInTheDocument()
  })

  it("calls onChange with toggled priority when a priority row is clicked", () => {
    const { onChange } = renderFilters()
    fireEvent.click(screen.getByRole("button", { name: /Filters/i }))
    fireEvent.click(screen.getByText("High"))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ priorities: ["HIGH"] })
    )
  })

  it("calls onChange with toggled location type when a location row is clicked", () => {
    const { onChange } = renderFilters()
    fireEvent.click(screen.getByRole("button", { name: /Filters/i }))
    fireEvent.click(screen.getByText("Remote"))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ locationTypes: ["REMOTE"] })
    )
  })

  it("calls onChange with toggled source when a source row is clicked", () => {
    const { onChange } = renderFilters()
    fireEvent.click(screen.getByRole("button", { name: /Filters/i }))
    fireEvent.click(screen.getByText("LinkedIn"))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ sources: ["LINKEDIN"] })
    )
  })

  it("calls onChange with minExcitement when a star is clicked", () => {
    const { onChange } = renderFilters()
    fireEvent.click(screen.getByRole("button", { name: /Filters/i }))
    const stars = screen.getAllByText("★")
    fireEvent.click(stars[2]) // 3rd star = minExcitement 3
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ minExcitement: 3 })
    )
  })

  it("clears minExcitement when the active star is clicked again", () => {
    const { onChange } = renderFilters({ ...baseFilters, minExcitement: 3 })
    fireEvent.click(screen.getByRole("button", { name: /Filters/i }))
    const stars = screen.getAllByText("★")
    fireEvent.click(stars[2]) // click same star
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ minExcitement: null })
    )
  })

  it("calls onChange with days when a date radio is clicked", () => {
    const { onChange } = renderFilters()
    fireEvent.click(screen.getByRole("button", { name: /Filters/i }))
    fireEvent.click(screen.getByText("Last 30 days"))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ days: 30 })
    )
  })

  it("clears days when the active date radio is clicked again", () => {
    const { onChange } = renderFilters({ ...baseFilters, days: 30 })
    fireEvent.click(screen.getByRole("button", { name: /Filters/i }))
    // Scope to the panel to avoid ambiguity with the active chip
    const panel = screen.getByTestId("filter-panel")
    fireEvent.click(within(panel).getByText("Last 30 days").closest("label")!)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ days: null })
    )
  })

  it("shows active count badge on Filters button when non-status filters are set", () => {
    renderFilters({ ...baseFilters, priorities: ["HIGH"], locationTypes: ["REMOTE"] })
    expect(screen.getByText("2")).toBeInTheDocument()
  })
})

// ── Active chips ───────────────────────────────────────────────

describe("JobsFilters — active chips", () => {
  it("shows an active chip for each active priority", () => {
    renderFilters({ ...baseFilters, priorities: ["HIGH"] })
    expect(screen.getByText("Priority: High")).toBeInTheDocument()
  })

  it("shows an active chip for each active location type", () => {
    renderFilters({ ...baseFilters, locationTypes: ["REMOTE"] })
    expect(screen.getByText("Remote")).toBeInTheDocument()
  })

  it("shows an active chip for minExcitement", () => {
    renderFilters({ ...baseFilters, minExcitement: 4 })
    expect(screen.getByText("★ 4+")).toBeInTheDocument()
  })

  it("shows an active chip for active date range", () => {
    renderFilters({ ...baseFilters, days: 60 })
    expect(screen.getByText("Last 60 days")).toBeInTheDocument()
  })

  it("clears a specific chip when its × button is clicked", () => {
    const { onChange } = renderFilters({ ...baseFilters, priorities: ["HIGH", "LOW"] })
    // Find the chip by its label text, then click the X button within it
    const chipSpan = screen.getByText("Priority: High").closest("span")!
    const xBtn = chipSpan.querySelector("button")!
    fireEvent.click(xBtn)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ priorities: ["LOW"] })
    )
  })
})

// ── Clear all ──────────────────────────────────────────────────

describe("JobsFilters — clear all", () => {
  it("does not render Clear all when no filters are active", () => {
    renderFilters()
    expect(screen.queryByText("Clear all")).not.toBeInTheDocument()
  })

  it("renders Clear all when a status filter is active", () => {
    renderFilters({ ...baseFilters, statuses: ["APPLIED"] })
    expect(screen.getByText("Clear all")).toBeInTheDocument()
  })

  it("calls onChange with EMPTY_FILTERS when Clear all is clicked", () => {
    const { onChange } = renderFilters({ ...baseFilters, statuses: ["APPLIED"], priorities: ["HIGH"] })
    fireEvent.click(screen.getByText("Clear all"))
    expect(onChange).toHaveBeenCalledWith(EMPTY_FILTERS)
  })
})

// ── Result count ───────────────────────────────────────────────

describe("JobsFilters — result count", () => {
  it("does not show count when no filters are active", () => {
    renderFilters(baseFilters, { totalCount: 10, filteredCount: 5 })
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument()
  })

  it("does not show count when filtered equals total", () => {
    renderFilters({ ...baseFilters, statuses: ["APPLIED"] }, { totalCount: 10, filteredCount: 10 })
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument()
  })

  it("shows count when filters reduce results", () => {
    renderFilters({ ...baseFilters, statuses: ["APPLIED"] }, { totalCount: 10, filteredCount: 3 })
    expect(screen.getByText("Showing 3 of 10 applications")).toBeInTheDocument()
  })
})
