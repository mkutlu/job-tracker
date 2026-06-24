/**
 * Sidebar unit tests
 * Covers: initials, subtitle fallback, nav item rendering, user info display.
 */
import React from "react"
import { render, screen } from "@testing-library/react"
import { UserJobStatus } from "@prisma/client"
import { Sidebar } from "../sidebar"

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({
  usePathname: () => "/jobs",
}))

jest.mock("@/app/actions/auth", () => ({
  signOut: jest.fn(),
}))

// Render motion.* elements as plain HTML equivalents so jsdom doesn't complain
jest.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_: object, tag: string) =>
        // eslint-disable-next-line react/display-name
        ({ children, layoutId: _lid, whileHover: _wh, whileTap: _wt, variants: _v, initial: _i, animate: _a, transition: _t, ...rest }: React.HTMLAttributes<HTMLElement> & { layoutId?: string; whileHover?: object; whileTap?: object; variants?: object; initial?: object | string; animate?: object | string; transition?: object }) =>
          React.createElement(tag, rest, children),
    }
  ),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const baseProfile = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  jobStatus: "EMPLOYED" as UserJobStatus,
}

function renderSidebar(overrides: Partial<typeof baseProfile & { currentTitle?: string }> = {}) {
  return render(<Sidebar profile={{ ...baseProfile, ...overrides }} />)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Sidebar — initials", () => {
  it("shows first letter of first and last name uppercased", () => {
    renderSidebar({ firstName: "Jane", lastName: "Doe" })
    expect(screen.getByText("JD")).toBeInTheDocument()
  })

  it("handles single-character names", () => {
    renderSidebar({ firstName: "A", lastName: "B" })
    expect(screen.getByText("AB")).toBeInTheDocument()
  })

  it("forces initials to uppercase regardless of input casing", () => {
    renderSidebar({ firstName: "alice", lastName: "smith" })
    expect(screen.getByText("AS")).toBeInTheDocument()
  })
})

describe("Sidebar — user info display", () => {
  it("renders full name", () => {
    renderSidebar({ firstName: "Jane", lastName: "Doe" })
    expect(screen.getByText("Jane Doe")).toBeInTheDocument()
  })

  it("shows currentTitle when provided", () => {
    renderSidebar({ currentTitle: "Senior Engineer" })
    expect(screen.getByText("Senior Engineer")).toBeInTheDocument()
  })

  it("falls back to status label when currentTitle is absent", () => {
    renderSidebar({ jobStatus: "UNEMPLOYED", currentTitle: undefined })
    expect(screen.getByText("Open to work")).toBeInTheDocument()
  })

  it("falls back to status label when currentTitle is empty string", () => {
    renderSidebar({ jobStatus: "FREELANCE", currentTitle: "" })
    expect(screen.getByText("Freelancing")).toBeInTheDocument()
  })

  it("maps every UserJobStatus to a label", () => {
    const cases: Array<[UserJobStatus, string]> = [
      ["EMPLOYED",   "Currently employed"],
      ["UNEMPLOYED", "Open to work"],
      ["FREELANCE",  "Freelancing"],
      ["STUDENT",    "Student"],
    ]
    cases.forEach(([jobStatus, expectedLabel]) => {
      const { unmount } = renderSidebar({ jobStatus, currentTitle: undefined })
      expect(screen.getByText(expectedLabel)).toBeInTheDocument()
      unmount()
    })
  })
})

describe("Sidebar — navigation", () => {
  beforeEach(() => renderSidebar())

  it("renders all main nav items", () => {
    expect(screen.getByText("Overview")).toBeInTheDocument()
    expect(screen.getByText("Jobs")).toBeInTheDocument()
    expect(screen.getByText("Companies")).toBeInTheDocument()
    expect(screen.getByText("Contacts")).toBeInTheDocument()
    expect(screen.getByText("JD Analysis")).toBeInTheDocument()
  })

  it("renders Settings link", () => {
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  it("renders the logout button", () => {
    expect(screen.getByTitle("Sign out")).toBeInTheDocument()
  })
})
