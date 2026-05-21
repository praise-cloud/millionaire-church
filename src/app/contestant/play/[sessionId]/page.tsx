"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, Trophy, Phone, Users, HelpCircle, Sun, Moon } from "lucide-react"

import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"

type Question = {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  prize_amount: number
}

type Session = {
  id: string
  host_id: string
  contestant_id: string
  status: string
  current_question_index: number
  total_prize: number
  lifeline_50: boolean
  lifeline_phone: boolean
  lifeline_audience: boolean
}

export default function ContestantPlay() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [session, setSession] = useState<Session | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  // Lifelines state
  const [fiftyRemoved, setFiftyRemoved] = useState<Set<string>>(new Set())
  const [lifeline50Used, setLifeline50Used] = useState(false)
  const [phoneAnswer, setPhoneAnswer] = useState<string | null>(null)
  const [audienceData, setAudienceData] = useState<Record<string, number> | null>(null)
  const [lifelineDialog, setLifelineDialog] = useState<string | null>(null)

  const currentQuestion = questions[currentIndex]

  const loadGame = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth"); return }

    const { data: sessions } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("id", params.sessionId)

    const session = sessions?.[0] || null
    if (!session || session.contestant_id !== user.id) {
      router.push("/contestant/lobby")
      return
    }

    setSession(session)

    const { data: sq } = await supabase
      .from("session_questions")
      .select("question_id")
      .eq("session_id", params.sessionId)
      .order("question_order")

    if (sq && sq.length > 0) {
      const qIds = sq.map((s) => s.question_id)
      const { data: qs } = await supabase
        .from("questions")
        .select("*")
        .in("id", qIds)
      if (qs) {
        const ordered = qIds.map((id) => qs.find((q) => q.id === id)!).filter(Boolean)
        setQuestions(ordered)
        setCurrentIndex(session.current_question_index || 0)
      }
    }

    setLoading(false)
  }, [params.sessionId])

  useEffect(() => { loadGame() }, [loadGame])

  const handleAnswer = async (answer: string) => {
    if (answered || submitting || !currentQuestion || !session) return
    setSubmitting(true)
    setSelectedAnswer(answer)

    const correct = answer === currentQuestion.correct_answer
    setIsCorrect(correct)
    setAnswered(true)

    const prizeChange = correct
      ? currentQuestion.prize_amount
      : -Math.min(currentQuestion.prize_amount, session.total_prize)
    const newPrize = Math.max(0, session.total_prize + prizeChange)
    const nextIndex = currentIndex + 1

    await supabase.from("game_rounds").insert({
      session_id: session.id,
      question_id: currentQuestion.id,
      contestant_answer: answer,
      is_correct: correct,
      prize_earned: correct ? currentQuestion.prize_amount : 0,
    })

    await supabase
      .from("game_sessions")
      .update({ total_prize: newPrize, current_question_index: nextIndex })
      .eq("id", session.id)
    setSession({ ...session, total_prize: newPrize, current_question_index: nextIndex })

    setSubmitting(false)
  }

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      supabase
        .from("game_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", session!.id)
        .then(() => {
          setGameOver(true)
        })
    } else {
      setCurrentIndex((i) => i + 1)
      setAnswered(false)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setFiftyRemoved(new Set())
      setPhoneAnswer(null)
      setAudienceData(null)
    }
  }

  const useLifeline50 = () => {
    if (!currentQuestion || lifeline50Used) return
    const options = ["a", "b", "c", "d"].filter((o) => o !== currentQuestion.correct_answer)
    const toRemove = new Set(options.sort(() => Math.random() - 0.5).slice(0, 2))
    setFiftyRemoved(toRemove)
    setLifeline50Used(true)
    setLifelineDialog("50")
    supabase.from("game_sessions").update({ lifeline_50: false }).eq("id", session!.id)
    setSession((s) => (s ? { ...s, lifeline_50: false } : s))
  }

  const useLifelinePhone = () => {
    if (!currentQuestion || !session?.lifeline_phone) return
    const isCorrect = Math.random() < 0.75
    const answer = isCorrect ? currentQuestion.correct_answer : ["a", "b", "c", "d"].sort(() => Math.random() - 0.5)[0]
    setPhoneAnswer(answer)
    setLifelineDialog("phone")
    supabase.from("game_sessions").update({ lifeline_phone: false }).eq("id", session!.id)
    setSession((s) => (s ? { ...s, lifeline_phone: false } : s))
  }

  const useLifelineAudience = () => {
    if (!currentQuestion || !session?.lifeline_audience) return
    const weights: Record<string, number> = {}
    for (const opt of ["a", "b", "c", "d"]) {
      weights[opt] = opt === currentQuestion.correct_answer
        ? 50 + Math.floor(Math.random() * 30)
        : Math.floor(Math.random() * 25)
    }
    const total = Object.values(weights).reduce((a, b) => a + b, 0)
    const percentages: Record<string, number> = {}
    for (const opt of ["a", "b", "c", "d"]) {
      percentages[opt] = Math.round((weights[opt] / total) * 100)
    }
    setAudienceData(percentages)
    setLifelineDialog("audience")
    supabase.from("game_sessions").update({ lifeline_audience: false }).eq("id", session!.id)
    setSession((s) => (s ? { ...s, lifeline_audience: false } : s))
  }

  const optionLabels = ["a", "b", "c", "d"]

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span className="font-bold text-lg">Who Wants to Be a Millionaire</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-yellow-500 font-bold text-lg">
              ₦{session?.total_prize.toLocaleString() || "0"}
            </div>
            <Badge variant="secondary" className="text-sm">
              Q{currentIndex + 1}/{questions.length}
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center max-w-3xl">
        {gameOver ? (
          <Card className="w-full max-w-md bg-white/10 border-white/20 text-white">
            <CardHeader className="text-center">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <CardTitle className="text-3xl text-white">Game Over!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-lg">
                Congratulations! You completed all questions!
              </p>
              <div className="text-5xl font-bold text-yellow-500">
                ₦{session?.total_prize.toLocaleString() || "0"}
              </div>
              <Button
                onClick={() => router.push("/contestant/lobby")}
                className="mt-4"
              >
                Back to Lobby
              </Button>
            </CardContent>
          </Card>
        ) : currentQuestion ? (
          <>
            {/* Prize Amount */}
            <div className="text-center mb-8">
              <p className="text-sm text-yellow-400 mb-1">This question is worth</p>
              <p className="text-4xl font-bold text-yellow-500">
                ₦{currentQuestion.prize_amount.toLocaleString()}
              </p>
            </div>

            {/* Question */}
            <Card className="w-full bg-white/10 border-white/20 text-white mb-8">
              <CardContent className="py-6 text-center">
                <p className="text-xl font-medium">{currentQuestion.question_text}</p>
              </CardContent>
            </Card>

            {/* Lifelines */}
            <div className="flex gap-3 mb-6">
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 gap-2"
                disabled={!session?.lifeline_50 || answered}
                onClick={useLifeline50}
              >
                <HelpCircle className="h-4 w-4" />
                50:50
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 gap-2"
                disabled={!session?.lifeline_phone || answered}
                onClick={useLifelinePhone}
              >
                <Phone className="h-4 w-4" />
                Phone
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 gap-2"
                disabled={!session?.lifeline_audience || answered}
                onClick={useLifelineAudience}
              >
                <Users className="h-4 w-4" />
                Audience
              </Button>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {optionLabels.map((opt) => {
                const label = opt.toUpperCase()
                const text = currentQuestion[`option_${opt}` as keyof Question] as string
                const isFiftyRemoved = fiftyRemoved.has(opt)
                const showPhone = phoneAnswer === opt

                if (isFiftyRemoved && !answered) return null

                return (
                  <Button
                    key={opt}
                    variant="outline"
                    size="lg"
                    className={`h-auto py-4 px-6 text-left justify-start text-base border-2 ${
                      answered
                        ? opt === currentQuestion.correct_answer
                          ? "border-green-500 bg-green-500/20 text-green-300"
                          : opt === selectedAnswer && !isCorrect
                          ? "border-red-500 bg-red-500/20 text-red-300"
                          : "border-white/10 opacity-50"
                        : "border-white/20 text-white hover:bg-white/10 hover:border-white/40"
                    } ${showPhone ? "ring-2 ring-yellow-500" : ""}`}
                    disabled={answered || submitting}
                    onClick={() => handleAnswer(opt)}
                  >
                    <span className="font-bold mr-3 text-muted-foreground">{label}.</span>
                    <span className="flex-1">{text}</span>
                    {showPhone && <Phone className="h-4 w-4 text-yellow-500 ml-2" />}
                  </Button>
                )
              })}
            </div>

            {answered && (
              <div className="mt-6 text-center">
                <p className={`text-lg font-semibold mb-3 ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                  {isCorrect ? "Correct! 🎉" : "Wrong Answer!"}
                </p>
                <Button onClick={handleNext} size="lg">
                  {currentIndex + 1 >= questions.length ? "See Results" : "Next Question"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">No questions in this session.</p>
        )}
      </main>

      {/* Lifeline Dialogs */}
      <Dialog open={lifelineDialog === "50"} onOpenChange={(o) => !o && setLifelineDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>50:50 Lifeline Used!</DialogTitle>
            <DialogDescription>Two wrong answers have been removed.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={lifelineDialog === "phone"} onOpenChange={(o) => !o && setLifelineDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phone a Friend</DialogTitle>
            <DialogDescription>
              Your friend suggests: <span className="font-bold text-lg">
                {phoneAnswer ? `${phoneAnswer.toUpperCase()}: ${currentQuestion?.[`option_${phoneAnswer}` as keyof Question]}` : ""}
              </span>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={lifelineDialog === "audience"} onOpenChange={(o) => !o && setLifelineDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ask the Audience</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {audienceData && optionLabels.map((opt) => (
              <div key={opt} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{opt.toUpperCase()}: {currentQuestion?.[`option_${opt}` as keyof Question]}</span>
                  <span>{audienceData[opt]}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all duration-500"
                    style={{ width: `${audienceData[opt]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
