"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Trophy, Plus, LogOut, ClipboardList, Play, Users, Loader2 } from "lucide-react"

type Profile = {
  id: string
  email: string
  full_name: string
  role: string
}

type Session = {
  id: string
  join_code: string
  status: string
  current_question_index: number
  total_prize: number
  contestant_id: string | null
  created_at: string
}

export default function HostDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [questionsCount, setQuestionsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (!profile || profile.role !== "host") {
        router.push("/")
        return
      }

      setProfile(profile)

      const { data: sessions } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false })

      if (sessions) setSessions(sessions)

      const { count } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("host_id", user.id)

      setQuestionsCount(count || 0)
      setLoading(false)
    }
    load()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const createSession = async () => {
    if (!profile) return

    const { data: questions } = await supabase
      .from("questions")
      .select("id")
      .eq("host_id", profile.id)

    if (!questions || questions.length === 0) {
      toast.error("Create at least one question first!")
      return
    }

    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data: session, error } = await supabase
      .from("game_sessions")
      .insert({
        host_id: profile.id,
        join_code: joinCode,
        status: "waiting",
      })
      .select()
      .single()

    if (error) {
      toast.error("Failed to create session")
      return
    }

    // Link questions to session
    const sessionQuestions = questions.map((q, i) => ({
      session_id: session.id,
      question_id: q.id,
      question_order: i,
    }))

    await supabase.from("session_questions").insert(sessionQuestions)

    toast.success(`Session created! Join code: ${joinCode}`)
    setSessions([session, ...sessions])
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span className="font-bold text-lg">Host Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{profile?.full_name}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{questionsCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessions.filter((s) => s.status === "waiting" || s.status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessions.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Link href="/host/questions">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Manage Questions
            </Button>
          </Link>
          <Button onClick={createSession} variant="secondary" className="gap-2">
            <Play className="h-4 w-4" /> Create New Session
          </Button>
        </div>

        <Separator className="my-6" />

        <h2 className="text-xl font-semibold mb-4">Your Sessions</h2>

        {sessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No sessions yet. Create your first session to get started!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      Session: <span className="font-mono text-primary">{session.join_code}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Status: <Badge variant={session.status === "completed" ? "secondary" : session.status === "active" ? "default" : "outline"}>{session.status}</Badge>
                      {session.contestant_id && " | Contestant joined"}
                      {session.status === "completed" && ` | Prize: ₦${session.total_prize.toLocaleString()}`}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(session.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
