"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, UserPlus, Gamepad2, LogOut, LayoutDashboard, Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

type UserData = {
  id: string
  email: string
  full_name: string
  role: string
} | null

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<UserData>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single()
        setUser(profile)
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  const getDashboardLink = () => {
    if (!user) return "/auth"
    return user.role === "host" ? "/host/dashboard" : "/contestant/lobby"
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span className="font-bold text-xl">Millionaire Church</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm font-medium">{user.full_name}</div>
                  <div className="px-2 pb-1.5 text-xs text-muted-foreground capitalize">{user.role}</div>
                  <DropdownMenuItem onClick={() => router.push(getDashboardLink())}>
                    <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/auth?tab=register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 md:py-32 text-center px-4">
          <Badge className="mb-4" variant="secondary">Church Community Game</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Who Wants to Be a{" "}
            <span className="text-yellow-500">Millionaire</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Test your knowledge, win amazing prizes, and have fun with our church community!
            Hosts create questions, contestants answer and win big!
          </p>
          <div className="flex items-center justify-center gap-4">
            {user ? (
              <Link href={getDashboardLink()}>
                <Button size="lg" className="gap-2">
                  <LayoutDashboard className="h-5 w-5" />
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth?tab=register">
                  <Button size="lg" className="gap-2">
                    <UserPlus className="h-5 w-5" />
                    Join as Contestant
                  </Button>
                </Link>
                <Link href="/auth?tab=register&role=host">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Gamepad2 className="h-5 w-5" />
                    Register as Host
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Gamepad2 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>1. Host Creates Game</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Hosts sign up, create questions with prize amounts in ₦, and start a game session.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <UserPlus className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>2. Contestant Joins</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Contestants sign up, enter the join code, and the game begins!
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  </div>
                  <CardTitle>3. Answer & Win</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    Answer questions correctly to win prize money in ₦. Use lifelines to help you along the way!
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          Built with love for our church community &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}
