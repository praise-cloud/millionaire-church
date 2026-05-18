"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Trophy, Plus, Pencil, Trash2, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

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

const defaultForm = {
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_answer: "a",
  prize_amount: 1000,
}

export default function HostQuestions() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth"); return }

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "host") { router.push("/"); return }

    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq("host_id", user.id)
      .order("created_at", { ascending: false })
    if (data) setQuestions(data)
    setLoading(false)
  }

  const resetForm = () => {
    setForm(defaultForm)
    setEditingId(null)
  }

  const openEdit = (q: Question) => {
    setForm({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      prize_amount: q.prize_amount,
    })
    setEditingId(q.id)
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editingId) {
      const { error } = await supabase
        .from("questions")
        .update(form)
        .eq("id", editingId)
      if (error) { toast.error("Failed to update question"); setSaving(false); return }
      toast.success("Question updated!")
    } else {
      const { error } = await supabase
        .from("questions")
        .insert({ ...form, host_id: user.id })
      if (error) { toast.error("Failed to create question"); setSaving(false); return }
      toast.success("Question created!")
    }

    setSaving(false)
    setDialogOpen(false)
    resetForm()
    loadQuestions()
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("questions").delete().eq("id", id)
    if (error) { toast.error("Failed to delete"); return }
    toast.success("Question deleted")
    loadQuestions()
  }

  const options = [
    { key: "a", label: "A" },
    { key: "b", label: "B" },
    { key: "c", label: "C" },
    { key: "d", label: "D" },
  ]

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
            <span className="font-bold text-lg">Manage Questions</span>
          </div>
          <Link href="/host/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {questions.length} Question{questions.length !== 1 ? "s" : ""}
          </h2>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Question" : "New Question"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Input
                    value={form.question_text}
                    onChange={(e) => setForm({ ...form, question_text: e.target.value })}
                    placeholder="Enter your question..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {options.map((opt) => (
                    <div key={opt.key} className="space-y-2">
                      <Label>Option {opt.label}</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          value={form[`option_${opt.key}` as keyof typeof form] as string}
                          onChange={(e) => setForm({ ...form, [`option_${opt.key}`]: e.target.value })}
                          placeholder={`Option ${opt.label}`}
                          required
                        />
                        <input
                          type="radio"
                          name="correct"
                          value={opt.key}
                          checked={form.correct_answer === opt.key}
                          onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
                          className="h-4 w-4"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Prize Amount (₦)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.prize_amount}
                    onChange={(e) => setForm({ ...form, prize_amount: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingId ? "Update Question" : "Create Question"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No questions yet. Click "Add Question" to create your first one!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <Card key={q.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium mb-2">{q.question_text}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {options.map((opt) => (
                          <div
                            key={opt.key}
                            className={`px-3 py-1.5 rounded border ${
                              q.correct_answer === opt.key
                                ? "border-green-500 bg-green-50 dark:bg-green-950"
                                : "border-border"
                            }`}
                          >
                            <span className="font-medium">{opt.label}:</span>{" "}
                            {q[`option_${opt.key}` as keyof Question]}
                            {q.correct_answer === opt.key && (
                              <Badge variant="secondary" className="ml-1 text-[10px]">Correct</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge>₦{q.prize_amount.toLocaleString()}</Badge>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(q)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(q.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
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
