import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"

// ── Mock recharts (uses browser SVG APIs unavailable in JSDOM) ──
jest.mock("recharts", () => {
  const MockChart = () => <div data-testid="recharts-mock" />
  return {
    AreaChart: MockChart,
    BarChart: MockChart,
    Area: () => null,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    CartesianGrid: () => null,
    Cell: () => null,
    ResponsiveContainer: () => <div data-testid="recharts-mock" />,
  }
})

import { UpcomingSteps } from "../upcoming-steps"
import { SourceBars } from "../source-bars"
import { ActivityChart } from "../activity-chart"
import { PipelineChart } from "../pipeline-chart"

// ── UpcomingSteps ────────────────────────────────────────────────

describe("UpcomingSteps", () => {
  it("shows empty state when no items", () => {
    render(<UpcomingSteps items={[]} />)
    expect(screen.getByText("No upcoming deadlines")).toBeInTheDocument()
  })

  it("renders each item's title and company", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    render(
      <UpcomingSteps
        items={[
          { title: "Frontend Engineer", company: "Acme Corp", status: "INTERVIEW", date: future },
          { title: "Backend Dev", company: "Beta Inc", status: "PHONE_SCREEN", date: future },
        ]}
      />
    )
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument()
    expect(screen.getByText("Acme Corp")).toBeInTheDocument()
    expect(screen.getByText("Backend Dev")).toBeInTheDocument()
    expect(screen.getByText("Beta Inc")).toBeInTheDocument()
  })

  it("shows status badge for each item", () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    render(
      <UpcomingSteps
        items={[{ title: "Role", company: "Co", status: "OFFER", date: future }]}
      />
    )
    expect(screen.getByText("Offer")).toBeInTheDocument()
  })

  it("applies red styling for overdue items", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    render(
      <UpcomingSteps
        items={[{ title: "Overdue Role", company: "Co", status: "APPLIED", date: past }]}
      />
    )
    // Overdue dot should have bg-red-500
    const dot = document.querySelector(".bg-red-500")
    expect(dot).toBeInTheDocument()
  })

  it("applies amber styling for items due within 3 days", () => {
    const soon = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
    render(
      <UpcomingSteps
        items={[{ title: "Soon Role", company: "Co", status: "INTERVIEW", date: soon }]}
      />
    )
    const dot = document.querySelector(".bg-amber-400")
    expect(dot).toBeInTheDocument()
  })
})

// ── SourceBars ───────────────────────────────────────────────────

describe("SourceBars", () => {
  it("shows empty state when no data", () => {
    render(<SourceBars data={[]} total={0} />)
    expect(screen.getByText("No data yet")).toBeInTheDocument()
  })

  it("renders source names and counts", () => {
    render(
      <SourceBars
        data={[
          { name: "LinkedIn", value: 8 },
          { name: "Referral", value: 2 },
        ]}
        total={10}
      />
    )
    expect(screen.getByText("LinkedIn")).toBeInTheDocument()
    expect(screen.getByText("Referral")).toBeInTheDocument()
  })

  it("calculates and displays correct percentages", () => {
    render(
      <SourceBars
        data={[{ name: "Job Board", value: 3 }]}
        total={10}
      />
    )
    // 3/10 = 30%
    expect(screen.getByText("3 · 30%")).toBeInTheDocument()
  })

  it("sets correct bar width via inline style", () => {
    const { container } = render(
      <SourceBars
        data={[{ name: "LinkedIn", value: 5 }]}
        total={10}
      />
    )
    const bar = container.querySelector(".bg-primary") as HTMLElement
    expect(bar?.style.width).toBe("50%")
  })

  it("handles 0 total gracefully (no NaN)", () => {
    render(<SourceBars data={[{ name: "Other", value: 0 }]} total={0} />)
    expect(screen.getByText("0 · 0%")).toBeInTheDocument()
  })
})

// ── ActivityChart ────────────────────────────────────────────────

describe("ActivityChart", () => {
  const emptyData = Array.from({ length: 8 }, (_, i) => ({
    week: `Week ${i + 1}`,
    count: 0,
  }))

  it("shows empty state when all counts are zero", () => {
    render(<ActivityChart data={emptyData} />)
    expect(screen.getByText("No applications added yet")).toBeInTheDocument()
  })

  it("renders recharts when data has values", () => {
    const data = [...emptyData]
    data[3] = { week: "May 1", count: 3 }
    render(<ActivityChart data={data} />)
    expect(screen.getByTestId("recharts-mock")).toBeInTheDocument()
  })
})

// ── PipelineChart ────────────────────────────────────────────────

describe("PipelineChart", () => {
  it("shows empty state when data is empty", () => {
    render(<PipelineChart data={[]} />)
    expect(screen.getByText("No applications yet")).toBeInTheDocument()
  })

  it("renders recharts when data is present", () => {
    render(
      <PipelineChart
        data={[
          { name: "Applied", value: 5, color: "#818cf8" },
          { name: "Interview", value: 2, color: "#fbbf24" },
        ]}
      />
    )
    expect(screen.getByTestId("recharts-mock")).toBeInTheDocument()
  })
})
