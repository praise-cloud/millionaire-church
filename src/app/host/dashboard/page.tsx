"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Trophy, Plus, LogOut, ClipboardList, Play, Users, Loader2, Trash2 } from "lucide-react"


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

type Question = {
  id: string
  question_text: string
  prize_amount: number
}

export default function HostDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [questionsCount, setQuestionsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [showPicker, setShowPicker] = useState(false)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth")
        return
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)

      const profile = profiles?.[0] || null
      if (!profile || profile.role !== "host") {
        router.push("/auth")
        return
      }

      setProfile(profile)

      const { data: sessions } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false })

      if (sessions) setSessions(sessions.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i))

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

  const openQuestionPicker = async () => {
    if (!profile) return

    const { data: questions } = await supabase
      .from("questions")
      .select("id, question_text, prize_amount")
      .eq("host_id", profile.id)

    if (!questions || questions.length === 0) {
      toast.error("Create at least one question first!")
      return
    }

    setAllQuestions(questions)
    setSelectedIds(new Set(questions.map(q => q.id)))
    setShowPicker(true)
  }

  const toggleQuestion = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const doCreateSession = async () => {
    if (!profile || selectedIds.size === 0) {
      toast.error("Select at least one question!")
      return
    }

    setCreating(true)

    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data: sessions, error } = await supabase
      .from("game_sessions")
      .insert({
        host_id: profile.id,
        join_code: joinCode,
        status: "waiting",
      })
      .select()

    if (error || !sessions?.[0]) {
      toast.error("Failed to create session")
      setCreating(false)
      return
    }

    const session = sessions[0]

    const orderedIds = allQuestions.filter(q => selectedIds.has(q.id)).map(q => q.id)
    const sessionQuestions = orderedIds.map((qId, i) => ({
      session_id: session.id,
      question_id: qId,
      question_order: i,
    }))

    await supabase.from("session_questions").insert(sessionQuestions)

    setShowPicker(false)
    setCreating(false)
    toast.success(`Session created! Join code: ${joinCode}`)
    setSessions(prev => [session, ...prev])
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm("Delete this session? This cannot be undone.")) return

    const { error } = await supabase
      .from("game_sessions")
      .delete()
      .eq("id", sessionId)

    if (error) {
      toast.error("Failed to delete session")
      return
    }

    setSessions(prev => prev.filter(s => s.id !== sessionId))
    toast.success("Session deleted")
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
          <div className="flex items-center gap-2">
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
          <Button onClick={openQuestionPicker} variant="secondary" className="gap-2">
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
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground">
                      {new Date(session.created_at).toLocaleDateString()}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteSession(session.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={showPicker} onOpenChange={(o) => { if (!o && !creating) setShowPicker(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Questions</DialogTitle>
            <DialogDescription>
              Choose which questions to include in this session ({selectedIds.size} selected)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto py-2">
            {allQuestions.map((q) => (
              <label key={q.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer">
                <Checkbox
                  checked={selectedIds.has(q.id)}
                  onCheckedChange={() => toggleQuestion(q.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{q.question_text}</p>
                  <p className="text-xs text-muted-foreground">₦{q.prize_amount.toLocaleString()}</p>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPicker(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={doCreateSession} disabled={creating || selectedIds.size === 0}>
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Create Session ({selectedIds.size} questions)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
