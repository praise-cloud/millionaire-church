"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Trophy, LogOut, Play, Loader2, Key } from "lucide-react"

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
  host_id: string
  created_at: string
}

export default function ContestantLobby() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [joinCode, setJoinCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth"); return }

      const { data: profile } = await supabase
        .from("profiles").select("*").eq("id", user.id).single()
      if (!profile || profile.role !== "contestant") { router.push("/"); return }

      setProfile(profile)

      const { data: sessions } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("status", "waiting")
        .is("contestant_id", null)
        .order("created_at", { ascending: false })

      if (sessions) setSessions(sessions)
      setLoading(false)
    }
    load()
  }, [])

  const handleJoin = async (sessionId: string) => {
    if (!profile) return
    setJoining(true)
    const { error } = await supabase
      .from("game_sessions")
      .update({ contestant_id: profile.id, status: "active" })
      .eq("id", sessionId)
      .is("contestant_id", null)

    if (error) { toast.error("Failed to join session"); setJoining(false); return }
    toast.success("Joined session!")
    router.push(`/contestant/play/${sessionId}`)
  }

  const handleJoinByCode = async () => {
    if (!profile || !joinCode.trim()) { toast.error("Enter a join code"); return }
    setJoining(true)

    const { data: session } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("join_code", joinCode.trim().toUpperCase())
      .is("contestant_id", null)
      .single()

    if (!session) {
      toast.error("Invalid code or session already taken")
      setJoining(false)
      return
    }

    await supabase
      .from("game_sessions")
      .update({ contestant_id: profile.id, status: "active" })
      .eq("id", session.id)

    toast.success("Joined session!")
    router.push(`/contestant/play/${session.id}`)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
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
            <span className="font-bold text-lg">Contestant Lobby</span>
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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" /> Enter Join Code
            </CardTitle>
            <CardDescription>Ask your host for the join code</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter code (e.g. ABC123)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="font-mono uppercase max-w-xs"
                maxLength={8}
              />
              <Button onClick={handleJoinByCode} disabled={joining}>
                {joining ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Join Game
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <h2 className="text-xl font-semibold mb-4">Available Sessions</h2>

        {sessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No active sessions available. Ask a host to create one!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      Game Session <span className="font-mono text-primary">{session.join_code}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Created {new Date(session.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button onClick={() => handleJoin(session.id)} disabled={joining}>
                    Join
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
