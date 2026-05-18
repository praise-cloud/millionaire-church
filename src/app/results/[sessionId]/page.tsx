"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy, Home, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"

type RoundResult = {
  id: string
  is_correct: boolean | null
  prize_earned: number
  question_id: string
}

type SessionData = {
  total_prize: number
  status: string
}

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [session, setSession] = useState<SessionData | null>(null)
  const [rounds, setRounds] = useState<RoundResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth"); return }

      const { data: session } = await supabase
        .from("game_sessions")
        .select("total_prize, status")
        .eq("id", params.sessionId)
        .single()

      if (!session) { router.push("/"); return }
      setSession(session)

      const { data: rounds } = await supabase
        .from("game_rounds")
        .select("*")
        .eq("session_id", params.sessionId)
        .order("created_at")

      if (rounds) setRounds(rounds)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const correctCount = rounds.filter((r) => r.is_correct).length
  const totalCount = rounds.length

  return (
    <div className="flex flex-col flex-1 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span className="font-bold text-lg">Game Results</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center max-w-lg">
        <Trophy className="h-20 w-20 text-yellow-500 mb-6" />
        <h1 className="text-3xl font-bold mb-2">Game Complete!</h1>

        <Card className="w-full bg-white/10 border-white/20 text-white mt-8">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-xl">Your Final Prize</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-6xl font-bold text-yellow-500 mb-4">
              ₦{session?.total_prize.toLocaleString() || "0"}
            </div>

            <div className="flex justify-center gap-6 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{correctCount}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{totalCount - correctCount}</div>
                <div className="text-sm text-muted-foreground">Wrong</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{totalCount}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="w-full mt-8 space-y-2">
          {rounds.map((round, i) => (
            <div
              key={round.id}
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/5"
            >
              <span className="text-sm">Question {i + 1}</span>
              <div className="flex items-center gap-3">
                <span className="text-yellow-500 text-sm font-medium">
                  +₦{round.prize_earned.toLocaleString()}
                </span>
                {round.is_correct === true ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : round.is_correct === false ? (
                  <XCircle className="h-5 w-5 text-red-400" />
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mt-8">
          <Link href="/contestant/lobby">
            <Button size="lg">
              <Home className="h-4 w-4 mr-2" /> Back to Lobby
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
