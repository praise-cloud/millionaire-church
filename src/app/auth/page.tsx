"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Trophy, Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") === "register" ? "register" : "login"
  const defaultRole = searchParams.get("role") || "contestant"
  const [tab, setTab] = useState(defaultTab)
  const [loading, setLoading] = useState(false)

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regName, setRegName] = useState("")
  const [regRole, setRegRole] = useState(defaultRole)

  const supabase = createClient()

  const redirectToDashboard = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/"); return }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
    if (profile?.role === "host") {
      router.push("/host/dashboard")
    } else if (profile?.role === "contestant") {
      router.push("/contestant/lobby")
    } else {
      router.push("/")
    }
    router.refresh()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    await redirectToDashboard()
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: { data: { full_name: regName, role: regRole } },
    })
    if (authError) { toast.error(authError.message); setLoading(false); return }

    if (authData.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id, email: regEmail, full_name: regName, role: regRole,
      })
      if (profileError) {
        toast.error("Account created but profile setup failed. Please contact support.")
        setLoading(false)
        return
      }
    }

    // If session exists (email confirmation disabled), go straight to dashboard
    if (authData.session) {
      toast.success("Account created! Redirecting...")
      await redirectToDashboard()
      return
    }

    // Otherwise tell them to check email
    toast.success("Account created! Check your email to confirm, then sign in.")
    setTab("login")
    setLoading(false)
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <span className="font-bold text-2xl">Millionaire Church</span>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Sign in to your account to continue</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Join as a host or contestant</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input id="reg-name" placeholder="Your name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input id="reg-email" type="email" placeholder="you@example.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input id="reg-password" type="password" placeholder="•••••••• (min 6 chars)" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label>I want to join as...</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button type="button" variant={regRole === "contestant" ? "default" : "outline"} className="w-full" onClick={() => setRegRole("contestant")}>Contestant</Button>
                      <Button type="button" variant={regRole === "host" ? "default" : "outline"} className="w-full" onClick={() => setRegRole("host")}>Host</Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/" className="hover:underline">Back to home</Link>
        </p>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <AuthForm />
    </Suspense>
  )
}
