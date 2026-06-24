/**
 * Seed script for development dummy data.
 *
 * Usage:
 *   1. Get your Supabase user ID from: Supabase Dashboard → Authentication → Users
 *   2. Add it to .env.local: SEED_USER_ID=your-user-uuid-here
 *   3. Run: npx prisma db seed
 *
 * This creates data only for the given user — safe to run multiple times (deletes previous seed data first).
 */

import { PrismaClient, JobStatus, Priority, JobSource, LocationType } from "@prisma/client"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const prisma = new PrismaClient()

const userId = process.env.SEED_USER_ID
if (!userId) {
  console.error("❌  Set SEED_USER_ID in .env.local before seeding.")
  process.exit(1)
}
const safeUserId: string = userId

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

type SeedJob = {
  title: string
  company: string
  status: JobStatus
  priority: Priority
  excitement?: number
  location?: string
  locationType?: LocationType
  salaryMin?: number
  salaryMax?: number
  source?: JobSource
  recruiterName?: string
  appliedAt?: Date
  nextStepAt?: Date
  offerAmount?: number
  offerDeadline?: Date
  notes?: string
}

const seedData: SeedJob[] = [
  {
    title: "Senior Frontend Engineer",
    company: "Stripe",
    status: "INTERVIEW",
    priority: "HIGH",
    excitement: 5,
    location: "San Francisco, CA",
    locationType: "HYBRID",
    salaryMin: 160000,
    salaryMax: 200000,
    source: "LINKEDIN",
    appliedAt: daysAgo(18),
    nextStepAt: daysFromNow(3),
    notes: "Panel interview with 3 engineers + hiring manager. Focus on React architecture and performance.",
  },
  {
    title: "Staff Software Engineer",
    company: "Vercel",
    status: "TECHNICAL",
    priority: "HIGH",
    excitement: 5,
    location: "Remote",
    locationType: "REMOTE",
    salaryMin: 180000,
    salaryMax: 230000,
    source: "COMPANY_SITE",
    appliedAt: daysAgo(12),
    nextStepAt: daysFromNow(5),
    notes: "Take-home project: build a mini deployment CLI. 72-hour window starting Friday.",
  },
  {
    title: "Frontend Engineer",
    company: "Figma",
    status: "OFFER",
    priority: "HIGH",
    excitement: 4,
    location: "New York, NY",
    locationType: "HYBRID",
    salaryMin: 145000,
    salaryMax: 180000,
    source: "REFERRAL",
    recruiterName: "Sarah Chen",
    appliedAt: daysAgo(35),
    offerAmount: 165000,
    offerDeadline: daysFromNow(7),
    notes: "Offer: $165k base + 0.05% equity (4yr cliff). Negotiating for $175k.",
  },
  {
    title: "Full Stack Engineer",
    company: "Linear",
    status: "APPLIED",
    priority: "HIGH",
    excitement: 5,
    location: "Remote",
    locationType: "REMOTE",
    salaryMin: 150000,
    salaryMax: 190000,
    source: "COMPANY_SITE",
    appliedAt: daysAgo(5),
    nextStepAt: daysFromNow(14),
    notes: "Dream company. Work on the core editor performance.",
  },
  {
    title: "Product Engineer",
    company: "Notion",
    status: "PHONE_SCREEN",
    priority: "MEDIUM",
    excitement: 3,
    location: "San Francisco, CA",
    locationType: "HYBRID",
    salaryMin: 130000,
    salaryMax: 165000,
    source: "LINKEDIN",
    recruiterName: "Alex Rivera",
    appliedAt: daysAgo(10),
    nextStepAt: daysFromNow(2),
    notes: "30-min intro call with recruiter. Prep: why Notion, past product impact.",
  },
  {
    title: "Backend Engineer (Node.js)",
    company: "Cloudflare",
    status: "APPLIED",
    priority: "MEDIUM",
    excitement: 4,
    location: "Remote",
    locationType: "REMOTE",
    salaryMin: 135000,
    salaryMax: 170000,
    source: "JOB_BOARD",
    appliedAt: daysAgo(7),
    notes: "Interesting work on edge infrastructure. Rust experience a plus.",
  },
  {
    title: "Engineering Manager",
    company: "Loom",
    status: "BOOKMARKED",
    priority: "MEDIUM",
    excitement: 2,
    location: "San Francisco, CA",
    locationType: "HYBRID",
    salaryMin: 180000,
    salaryMax: 220000,
    source: "RECRUITER",
    recruiterName: "Mike Johnson",
    notes: "Inbound from recruiter. Not actively pursuing management track yet.",
  },
  {
    title: "React Native Engineer",
    company: "Airbnb",
    status: "BOOKMARKED",
    priority: "LOW",
    excitement: 3,
    location: "San Francisco, CA",
    locationType: "HYBRID",
    salaryMin: 155000,
    salaryMax: 195000,
    source: "LINKEDIN",
    notes: "Not mobile-focused but the team seems great. Keep an eye on it.",
  },
  {
    title: "Senior Software Engineer",
    company: "Intercom",
    status: "REJECTED",
    priority: "MEDIUM",
    excitement: 3,
    location: "Chicago, IL",
    locationType: "HYBRID",
    salaryMin: 120000,
    salaryMax: 150000,
    source: "LINKEDIN",
    appliedAt: daysAgo(45),
    notes: "Rejected after technical round. Feedback: needed stronger distributed systems knowledge.",
  },
  {
    title: "Frontend Architect",
    company: "Shopify",
    status: "WITHDRAWN",
    priority: "LOW",
    excitement: 2,
    location: "Remote",
    locationType: "REMOTE",
    salaryMin: 140000,
    salaryMax: 180000,
    source: "COMPANY_SITE",
    appliedAt: daysAgo(60),
    notes: "Withdrew — took too long and better opportunities appeared.",
  },
]

async function main() {
  console.log(`\n🌱 Seeding for user: ${safeUserId}\n`)

  // Clean up existing seed data for this user
  const deleted = await prisma.job.deleteMany({ where: { userId: safeUserId } })
  if (deleted.count > 0) console.log(`  🗑  Cleared ${deleted.count} existing jobs`)

  const deletedCompanies = await prisma.company.deleteMany({ where: { userId: safeUserId } })
  if (deletedCompanies.count > 0) console.log(`  🗑  Cleared ${deletedCompanies.count} existing companies`)

  // Seed
  for (const seed of seedData) {
    const existing = await prisma.company.findFirst({ where: { name: seed.company, userId: safeUserId } })
    const company = existing ?? await prisma.company.create({ data: { name: seed.company, userId: safeUserId } })

    await prisma.job.create({
      data: {
        userId: safeUserId,
        title: seed.title,
        companyId: company.id,
        status: seed.status,
        priority: seed.priority,
        excitement: seed.excitement ?? null,
        location: seed.location ?? null,
        locationType: seed.locationType ?? null,
        salaryMin: seed.salaryMin ?? null,
        salaryMax: seed.salaryMax ?? null,
        salaryCurrency: "USD",
        source: seed.source ?? null,
        recruiterName: seed.recruiterName ?? null,
        appliedAt: seed.appliedAt ?? null,
        nextStepAt: seed.nextStepAt ?? null,
        offerAmount: seed.offerAmount ?? null,
        offerDeadline: seed.offerDeadline ?? null,
        notes: seed.notes ?? null,
      },
    })

    console.log(`  ✅  ${seed.title} @ ${seed.company} (${seed.status})`)
  }

  console.log(`\n✨ Done — ${seedData.length} jobs created.\n`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
