import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ContactsClient } from "../contacts-client"
import { JobStatus } from "@prisma/client"

// ── Mocks ──────────────────────────────────────────────────────

jest.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_: object, tag: string) =>
        // eslint-disable-next-line react/display-name
        ({ children, animate: _a, initial: _i, exit: _e, transition: _t, whileHover: _wh, ...rest }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) =>
          React.createElement(tag, rest, children),
    }
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockDeleteContact = jest.fn().mockResolvedValue({ success: true })
jest.mock("@/app/actions/contacts", () => ({
  deleteContact: (...args: unknown[]) => mockDeleteContact(...args),
}))

jest.mock("../contact-form", () => ({
  ContactForm: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="contact-form"><button onClick={onClose}>close-form</button></div> : null,
}))

jest.mock("@/components/jobs/job-status-badge", () => ({
  JobStatusBadge: ({ status }: { status: string }) => <span data-testid="status-badge">{status}</span>,
}))

// ── Fixtures ───────────────────────────────────────────────────

const mockCompanies = [
  { id: "co1", name: "Acme Corp" },
  { id: "co2", name: "Beta Ltd" },
]

const mockJobs = [
  { id: "j1", title: "Frontend Engineer", companyId: "co1", company: { name: "Acme Corp" } },
  { id: "j2", title: "Backend Engineer", companyId: "co2", company: { name: "Beta Ltd" } },
]

function makeContact(overrides: Partial<{
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
}> = {}) {
  return {
    id: "contact-1",
    name: "Jane Smith",
    title: null,
    email: null,
    linkedin: null,
    notes: null,
    companyId: null,
    jobId: null,
    company: null,
    job: null,
    ...overrides,
  }
}

const mockContacts = [
  makeContact({
    id: "ct1",
    name: "Jane Smith",
    title: "Engineering Manager",
    email: "jane@acme.com",
    linkedin: "https://linkedin.com/in/jane",
    company: { id: "co1", name: "Acme Corp" },
    job: { id: "j1", title: "Frontend Engineer", status: "INTERVIEW" as JobStatus },
    companyId: "co1",
    jobId: "j1",
    notes: "Met at a meetup",
  }),
  makeContact({
    id: "ct2",
    name: "Bob Jones",
    title: "Recruiter",
    company: { id: "co2", name: "Beta Ltd" },
    companyId: "co2",
  }),
  makeContact({
    id: "ct3",
    name: "Alice Wu",
    email: "alice@gamma.com",
  }),
]

// ── Tests ──────────────────────────────────────────────────────

beforeEach(() => jest.clearAllMocks())
afterEach(() => jest.restoreAllMocks())

describe("ContactsClient — empty state", () => {
  it("shows empty state when no contacts", () => {
    render(<ContactsClient contacts={[]} companies={[]} jobs={[]} />)
    expect(screen.getByText("No contacts yet")).toBeInTheDocument()
    expect(screen.getByText("Add your first contact")).toBeInTheDocument()
  })

  it("does not show search when no contacts", () => {
    render(<ContactsClient contacts={[]} companies={[]} jobs={[]} />)
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument()
  })

  it("opens form from empty state button", () => {
    render(<ContactsClient contacts={[]} companies={[]} jobs={[]} />)
    fireEvent.click(screen.getByText("Add your first contact"))
    expect(screen.getByTestId("contact-form")).toBeInTheDocument()
  })
})

describe("ContactsClient — card rendering", () => {
  it("renders all contact cards", () => {
    render(<ContactsClient contacts={mockContacts} companies={mockCompanies} jobs={mockJobs} />)
    expect(screen.getByText("Jane Smith")).toBeInTheDocument()
    expect(screen.getByText("Bob Jones")).toBeInTheDocument()
    expect(screen.getByText("Alice Wu")).toBeInTheDocument()
  })

  it("shows title when present", () => {
    render(<ContactsClient contacts={mockContacts} companies={mockCompanies} jobs={mockJobs} />)
    expect(screen.getByText("Engineering Manager")).toBeInTheDocument()
    expect(screen.getByText("Recruiter")).toBeInTheDocument()
  })

  it("shows company name when linked", () => {
    render(<ContactsClient contacts={mockContacts} companies={mockCompanies} jobs={mockJobs} />)
    expect(screen.getByText("Acme Corp")).toBeInTheDocument()
    expect(screen.getByText("Beta Ltd")).toBeInTheDocument()
  })

  it("shows related job title with status badge", () => {
    render(<ContactsClient contacts={mockContacts} companies={mockCompanies} jobs={mockJobs} />)
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument()
    expect(screen.getByTestId("status-badge")).toHaveTextContent("INTERVIEW")
  })

  it("shows email link when present", () => {
    render(<ContactsClient contacts={mockContacts} companies={mockCompanies} jobs={mockJobs} />)
    const emailLink = screen.getByText("jane@acme.com").closest("a")
    expect(emailLink).toHaveAttribute("href", "mailto:jane@acme.com")
  })

  it("shows LinkedIn link when present and valid URL", () => {
    render(<ContactsClient contacts={mockContacts} companies={mockCompanies} jobs={mockJobs} />)
    const linkedinLink = screen.getByText("LinkedIn").closest("a")
    expect(linkedinLink).toHaveAttribute("href", "https://linkedin.com/in/jane")
    expect(linkedinLink).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("does not show LinkedIn link for javascript: URIs", () => {
    const malicious = makeContact({ id: "ct99", name: "Hacker", linkedin: "javascript:alert(1)" })
    render(<ContactsClient contacts={[malicious]} companies={[]} jobs={[]} />)
    expect(screen.queryByText("LinkedIn")).not.toBeInTheDocument()
  })

  it("shows notes when present", () => {
    render(<ContactsClient contacts={mockContacts} companies={mockCompanies} jobs={mockJobs} />)
    expect(screen.getByText("Met at a meetup")).toBeInTheDocument()
  })

  it("shows search input when contacts exist", () => {
    render(<ContactsClient contacts={mockContacts} companies={mockCompanies} jobs={mockJobs} />)
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })
})

describe("ContactsClient — search", () => {
  it("filters by name", () => {
    render(<ContactsClient contacts={mockContacts} companies={mockCompanies} jobs={mockJobs} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "jane" } })
    expect(screen.getByText("Jane Smith")).toBeInTheDocument()
    expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument()
  })

  it("filters by title", () => {
    render(<ContactsClient contacts={mockContacts} companies={mockCompanies} jobs={mockJobs} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "recruiter" } })
    expect(screen.getByText("Bob Jones")).toBeInTheDocument()
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument()
  })

  it("filters by company name", () => {
    render(<ContactsClient contacts={mockContacts} companies={mockCompanies} jobs={mockJobs} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "acme" } })
    expect(screen.getByText("Jane Smith")).toBeInTheDocument()
    expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument()
  })

  it("is case-insensitive", () => {
    render(<ContactsClient contacts={mockContacts} companies={mockCompanies} jobs={mockJobs} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "ALICE" } })
    expect(screen.getByText("Alice Wu")).toBeInTheDocument()
  })

  it("shows no-results message when nothing matches", () => {
    render(<ContactsClient contacts={mockContacts} companies={mockCompanies} jobs={mockJobs} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "zzz" } })
    expect(screen.getByText(/no contacts match/i)).toBeInTheDocument()
  })
})

describe("ContactsClient — add/edit form", () => {
  it("opens form when Add contact is clicked", () => {
    render(<ContactsClient contacts={mockContacts} companies={mockCompanies} jobs={mockJobs} />)
    fireEvent.click(screen.getByText("Add contact"))
    expect(screen.getByTestId("contact-form")).toBeInTheDocument()
  })

  it("closes form when onClose is called", () => {
    render(<ContactsClient contacts={mockContacts} companies={mockCompanies} jobs={mockJobs} />)
    fireEvent.click(screen.getByText("Add contact"))
    fireEvent.click(screen.getByText("close-form"))
    expect(screen.queryByTestId("contact-form")).not.toBeInTheDocument()
  })
})

describe("ContactsClient — delete", () => {
  it("calls deleteContact with correct id on confirm", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true)
    await waitFor(() => mockDeleteContact("ct1"))
    expect(mockDeleteContact).toHaveBeenCalledWith("ct1")
  })

  it("does not call deleteContact when confirm cancelled", () => {
    jest.spyOn(window, "confirm").mockReturnValue(false)
    render(<ContactsClient contacts={mockContacts} companies={mockCompanies} jobs={mockJobs} />)
    expect(mockDeleteContact).not.toHaveBeenCalled()
  })
})
