"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Briefcase, Sparkles, ArrowRight, Target, Brain, TrendingUp, CheckCircle2 } from "lucide-react"

const ease = [0.25, 0.1, 0.25, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
}

const features = [
  {
    icon: Target,
    title: "Application tracking",
    desc: "Capture every role, status, and follow-up date in one clean view. Nothing slips through.",
  },
  {
    icon: Brain,
    title: "AI-powered JD analysis",
    desc: "Paste a job description and surface the key skills, red flags, and must-haves instantly.",
  },
  {
    icon: TrendingUp,
    title: "Pipeline insights",
    desc: "See exactly where you stand across every stage and double down on what's working.",
  },
]

const steps = [
  {
    step: "01",
    title: "Add an application",
    desc: "Paste the job URL or fill in the details manually in seconds.",
  },
  {
    step: "02",
    title: "Analyse the JD",
    desc: "Get a plain-English breakdown of what the role truly requires.",
  },
  {
    step: "03",
    title: "Track your progress",
    desc: "Follow up at exactly the right moment and move faster through every stage.",
  },
]

const perks = ["No spreadsheets", "AI-powered analysis", "Pipeline clarity"]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">

      {/* ── Nav ── */}
      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="sticky top-0 z-50 border-b border-sidebar-border bg-sidebar/90 backdrop-blur-md"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sidebar-foreground">
            <Briefcase className="h-5 w-5 text-sidebar-logo" />
            <span>Job Tracker</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-primary-foreground bg-primary rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
          >
            Sign in
          </Link>
        </div>
      </motion.header>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center text-center py-36 px-6 bg-sidebar overflow-hidden">

        {/* Dot grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Glow orbs */}
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full blur-3xl pointer-events-none opacity-20 bg-sidebar-primary"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none opacity-15 bg-sidebar-logo"
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-2xl"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="mb-7">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sidebar-logo bg-sidebar-logo/10 border border-sidebar-logo/20 rounded-full px-3.5 py-1.5">
              <Sparkles className="h-3 w-3" />
              AI-powered job search
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl font-semibold text-sidebar-foreground leading-[1.1] tracking-tight mb-6"
          >
            Your job search,{" "}
            <span className="text-sidebar-logo italic">finally</span>{" "}
            organized.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="text-sidebar-muted text-lg leading-relaxed mb-10 max-w-md mx-auto"
          >
            Track applications, decode job descriptions with AI, and move through your pipeline with clarity.
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeUp}>
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-7 py-3.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get started free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </motion.div>

          {/* Perks */}
          <motion.div variants={fadeUp} className="mt-8 flex items-center justify-center gap-6 flex-wrap">
            {perks.map((p) => (
              <span key={p} className="flex items-center gap-1.5 text-xs text-sidebar-muted">
                <CheckCircle2 className="h-3.5 w-3.5 text-sidebar-logo shrink-0" />
                {p}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Gradient bridge */}
      <div className="h-24 bg-gradient-to-b from-sidebar to-background shrink-0" />

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 pb-28 w-full">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.div variants={fadeUp} className="text-center mb-14">
            <h2 className="text-3xl font-semibold text-foreground mb-3">Everything you need</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
              Built for the modern job search — focused, fast, and effective.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-card border border-border rounded-2xl p-8 group cursor-default hover:border-primary/30 hover:shadow-lg transition-[border-color,box-shadow] duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-foreground font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-card border-y border-border py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.div variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl font-semibold text-foreground mb-3">How it works</h2>
              <p className="text-muted-foreground max-w-xs mx-auto text-sm leading-relaxed">
                From first application to offer letter in three simple steps.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {steps.map(({ step, title, desc }) => (
                <motion.div key={step} variants={fadeUp} className="flex flex-col gap-4">
                  <span className="text-5xl font-bold text-primary/20 font-mono leading-none">
                    {step}
                  </span>
                  <div>
                    <h3 className="text-foreground font-semibold mb-1.5">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative py-28 px-6 bg-sidebar overflow-hidden">

        {/* Dot grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Center glow */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.14, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl pointer-events-none bg-sidebar-logo"
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="relative z-10 max-w-xl mx-auto text-center"
        >
          <motion.h2
            variants={fadeUp}
            className="text-4xl font-semibold text-sidebar-foreground leading-tight tracking-tight mb-4"
          >
            Ready to take control?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-sidebar-muted mb-10 leading-relaxed">
            Turn your job search from a scattered effort into a focused, winning system.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-8 py-4 font-medium hover:opacity-90 transition-opacity"
            >
              Start tracking for free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-sidebar border-t border-sidebar-border py-7 text-center">
        <p className="text-xs text-sidebar-muted">© 2025 Job Tracker</p>
      </footer>
    </div>
  )
}
