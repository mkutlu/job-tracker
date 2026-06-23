"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Briefcase } from "lucide-react"
import { createClient } from "@/lib/supabase"

type Mode = "signin" | "signup"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<Mode>("signin")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signupSent, setSignupSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const supabase = createClient()

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }
      setIsLoading(false)
      setSignupSent(true)
      return
    }

    router.push("/jobs")
    router.refresh()
  }

  const isSignIn = mode === "signin"

  if (signupSent) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-sm p-8 max-w-sm w-full text-center">
        <div className="flex flex-col items-center gap-3 mb-4">
          <Briefcase className="text-primary" size={28} />
          <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We sent a confirmation link to your inbox. Click it to activate your account, then come back to sign in.
          </p>
        </div>
        <button
          onClick={() => { setMode("signin"); setSignupSent(false) }}
          className="text-sm text-primary hover:underline mt-2"
        >
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-8 max-w-sm w-full">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <Briefcase className="text-primary" size={28} />
        <h1 className="text-xl font-semibold text-foreground">Job Tracker</h1>
        <p className="text-sm text-muted-foreground">
          {isSignIn ? "Sign in to your account" : "Create your account"}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isSignIn ? "current-password" : "new-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium disabled:opacity-60 cursor-pointer"
        >
          {isLoading
            ? isSignIn
              ? "Signing in..."
              : "Creating account..."
            : isSignIn
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <p className="mt-3 text-xs text-red-500 text-center">{error}</p>
      )}

      {/* Toggle mode */}
      <p className="mt-5 text-center text-sm text-muted-foreground">
        {isSignIn ? (
          <>
            Don&apos;t have an account?{" "}
            <span
              className="text-primary cursor-pointer"
              onClick={() => { setMode("signup"); setError(null); setSignupSent(false) }}
            >
              Sign up
            </span>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <span
              className="text-primary cursor-pointer"
              onClick={() => { setMode("signin"); setError(null); setSignupSent(false) }}
            >
              Sign in
            </span>
          </>
        )}
      </p>
    </div>
  )
}
