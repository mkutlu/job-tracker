import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { JobsTable, SortCol, SortDir } from "../jobs-table"
import { Prisma } from "@prisma/client"

// ── Mocks ──────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

jest.mock("@/app/actions/jobs", () => ({
  deleteJob: jest.fn().mockResolvedValue(undefined),
}))

jest.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_: object, tag: string) =>
        // eslint-disable-next-line react/display-name
        ({ children, layoutId: _l, whileHover: _wh, whileTap: _wt, variants: _v, initial: _i, animate: _a, transition: _t, ...rest }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) =>
          React.createElement(tag, rest, children),
    }
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ── Fixtures ───────────────────────────────────────────────────

type JobWithCompany = Prisma.JobGetPayload<{
  include: { company: { select: { name: true } } }
}>

function makeJob(overrides: Partial<JobWithCompany> & { companyName?: string } = {}): JobWithCompany {
  const { companyName = "Acme", ...rest } = overrides
  return {
    id: "job-1",
    userId: "user-1",
    title: "Frontend Engineer",
    status: "APPLIED",
    priority: "MEDIUM",
    excitement: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "USD",
    locationType: null,
    location: null,
    source: null,
    nextStepAt: null,
    recruiterName: null,
    appliedAt: null,
    offerAmount: null,
    notes: null,
    jobDescription: null,
    companyId: "company-1",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    company: { name: companyName },
    ...rest,
  }
}

const defaultProps = {
  onEdit: jest.fn(),
  onAdd: jest.fn(),
  sortCol: "added" as SortCol,
  sortDir: "desc" as SortDir,
  onSort: jest.fn(),
}

// ── Empty state ────────────────────────────────────────────────

describe("JobsTable — empty state", () => {
  it("renders the empty state heading when jobs array is empty", () => {
    render(<JobsTable jobs={[]} {...defaultProps} />)
    expect(screen.getByText("No applications yet")).toBeInTheDocument()
  })

  it("renders the call-to-action in empty state", () => {
    render(<JobsTable jobs={[]} {...defaultProps} />)
    expect(screen.getByText("Add your first application")).toBeInTheDocument()
  })

  it("calls onAdd when the empty-state button is clicked", () => {
    const onAdd = jest.fn()
    render(<JobsTable jobs={[]} {...defaultProps} onAdd={onAdd} />)
    fireEvent.click(screen.getByText("Add your first application"))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })
})

// ── Row rendering ──────────────────────────────────────────────

describe("JobsTable — row rendering", () => {
  it("renders a row for each job", () => {
    const jobs = [
      makeJob({ id: "1", title: "Role A", companyName: "Alpha" }),
      makeJob({ id: "2", title: "Role B", companyName: "Beta" }),
    ]
    render(<JobsTable jobs={jobs} {...defaultProps} />)
    expect(screen.getByText("Role A")).toBeInTheDocument()
    expect(screen.getByText("Role B")).toBeInTheDocument()
  })

  it("renders the company name in each row", () => {
    render(<JobsTable jobs={[makeJob({ companyName: "Stripe" })]} {...defaultProps} />)
    expect(screen.getByText("Stripe")).toBeInTheDocument()
  })

  it("renders the status badge for each job", () => {
    render(<JobsTable jobs={[makeJob({ status: "OFFER" })]} {...defaultProps} />)
    expect(screen.getByText("Offer")).toBeInTheDocument()
  })

  it("calls onEdit when a row is clicked", () => {
    const onEdit = jest.fn()
    const job = makeJob()
    render(<JobsTable jobs={[job]} {...defaultProps} onEdit={onEdit} />)
    fireEvent.click(screen.getByText("Frontend Engineer"))
    expect(onEdit).toHaveBeenCalledWith(job)
  })
})

// ── Sort headers ───────────────────────────────────────────────

describe("JobsTable — sortable headers", () => {
  const sortableCols: Array<{ label: string; col: SortCol }> = [
    { label: "Company / Role", col: "title" },
    { label: "Status",         col: "status" },
    { label: "Excitement",     col: "excitement" },
    { label: "Salary",         col: "salary" },
    { label: "Next step",      col: "nextStep" },
    { label: "Added",          col: "added" },
  ]

  sortableCols.forEach(({ label, col }) => {
    it(`calls onSort("${col}") when "${label}" header is clicked`, () => {
      const onSort = jest.fn()
      render(<JobsTable jobs={[makeJob()]} {...defaultProps} onSort={onSort} />)
      fireEvent.click(screen.getByText(label))
      expect(onSort).toHaveBeenCalledWith(col)
    })
  })

  it("calls onSort with priority column when Priority header is clicked", () => {
    const onSort = jest.fn()
    render(<JobsTable jobs={[makeJob()]} {...defaultProps} onSort={onSort} />)
    fireEvent.click(screen.getByText("Priority"))
    expect(onSort).toHaveBeenCalledWith("priority")
  })
})

// ── Actions ────────────────────────────────────────────────────

describe("JobsTable — edit and delete", () => {
  it("calls onEdit when the edit pencil button is clicked", () => {
    const onEdit = jest.fn()
    const job = makeJob()
    render(<JobsTable jobs={[job]} {...defaultProps} onEdit={onEdit} />)
    const editButtons = screen.getAllByRole("button")
    const pencilBtn = editButtons.find((b) => b.querySelector("svg"))
    if (pencilBtn) fireEvent.click(pencilBtn)
    expect(onEdit).toHaveBeenCalled()
  })
})
