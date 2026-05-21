"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Trophy, UserPlus, Gamepad2, LogOut, LayoutDashboard, Loader2,
  HelpCircle, Phone, Users, Sparkles, ChevronRight, Star, Quote,
} from "lucide-react"
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
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)

        let profile = profiles?.[0] || null

        // If profile doesn't exist, create one from auth metadata
        if (!profile && authUser.user_metadata) {
          const meta = authUser.user_metadata
          const { data: newProfiles, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: authUser.id,
              email: authUser.email || "",
              full_name: meta.full_name || meta.name || "User",
              role: meta.role || "contestant",
            })
            .select()
          if (!insertError) profile = newProfiles?.[0] || null
        }

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
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary rounded-lg w-8 h-8 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Millionaire Church</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          </nav>

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
              <div className="flex items-center gap-2">
                <Link href="/auth">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth?tab=register">
                  <Button size="sm" className="gap-1">
                    Get Started <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <Badge className="mb-4" variant="secondary">
                <Sparkles className="h-3 w-3 mr-1" /> Church Community Game
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
                Who Wants to Be a{" "}
                <span className="text-primary">Millionaire</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Test your knowledge, win amazing prizes, and have fun with our church community!
                Hosts create questions, contestants answer and win big in ₦!
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                {user ? (
                  <Link href={getDashboardLink()}>
                    <Button size="lg" className="gap-2 w-full sm:w-auto">
                      <LayoutDashboard className="h-5 w-5" />
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth?tab=register">
                      <Button size="lg" className="gap-2 w-full sm:w-auto">
                        <UserPlus className="h-5 w-5" />
                        Join as Contestant
                      </Button>
                    </Link>
                    <Link href="/auth?tab=register&role=host">
                      <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                        <Gamepad2 className="h-5 w-5" />
                        Register as Host
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="relative">
                <div className="w-72 h-72 md:w-96 md:h-96 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border flex items-center justify-center">
                  <div className="text-center p-8">
                    <Trophy className="h-20 w-20 text-yellow-500 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-primary">₦1,000,000</div>
                    <p className="text-sm text-muted-foreground mt-2">Grand Prize</p>
                    <div className="flex gap-2 justify-center mt-4">
                      <div className="w-2 h-2 rounded-full bg-primary/60" />
                      <div className="w-2 h-2 rounded-full bg-primary/40" />
                      <div className="w-2 h-2 rounded-full bg-primary/20" />
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl" />
                <div className="absolute -top-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Three Simple Steps</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Get started in minutes. Hosts create games, contestants join and play!
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[{
              step: "01",
              icon: Gamepad2,
              title: "Host Creates Game",
              desc: "Hosts sign up, create questions with prize amounts in ₦, and start a game session with a unique join code.",
            }, {
              step: "02",
              icon: UserPlus,
              title: "Contestant Joins",
              desc: "Contestants sign up, enter the join code, and the game begins immediately!",
            }, {
              step: "03",
              icon: Trophy,
              title: "Answer & Win",
              desc: "Answer questions correctly to win prize money. Use lifelines like 50:50, Phone a Friend, or Ask the Audience!",
            }].map((item) => (
              <Card key={item.step} className="text-center border-0 shadow-sm bg-card hover:shadow-md transition-shadow">
                <CardContent className="pt-8 pb-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-xs font-bold text-primary mb-2">{item.step}</div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Built-in lifelines, prize tracking, and more to make your game night unforgettable.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[{
              icon: HelpCircle,
              title: "50:50 Lifeline",
              desc: "Remove two wrong answers to increase your chances.",
            }, {
              icon: Phone,
              title: "Phone a Friend",
              desc: "Call a friend who suggests the correct answer (75% accuracy).",
            }, {
              icon: Users,
              title: "Ask the Audience",
              desc: "See live audience poll results before answering.",
            }, {
              icon: Trophy,
              title: "Prize Ladder",
              desc: "Each question has its own prize amount set by the host.",
            }, {
              icon: Star,
              title: "Join Codes",
              desc: "Quick and easy session joining with unique game codes.",
            }, {
              icon: LayoutDashboard,
              title: "Host Dashboard",
              desc: "Full control over questions, sessions, and player tracking.",
            }].map((feature) => (
              <Card key={feature.title} className="border bg-card hover:border-primary/20 transition-colors">
                <CardContent className="pt-6 pb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Quote className="h-8 w-8 text-primary/30 mx-auto mb-4" />
            <blockquote className="text-xl md:text-2xl font-medium italic mb-6 leading-relaxed">
              "This game brought our church youth group together like never before. 
              The kids had so much fun competing and learning at the same time!"
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                PS
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">Pastor Samuel</div>
                <div className="text-xs text-muted-foreground">Youth Ministry Leader</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Play?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
            Join the fun! Register now and start your millionaire journey.
          </p>
          <div className="flex items-center justify-center gap-4">
            {user ? (
              <Link href={getDashboardLink()}>
                <Button size="lg" variant="secondary" className="gap-2">
                  <LayoutDashboard className="h-5 w-5" /> Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth?tab=register">
                  <Button size="lg" variant="secondary" className="gap-2">
                    <UserPlus className="h-5 w-5" /> Join Now
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10 gap-2">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary rounded-lg w-8 h-8 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold">Millionaire Church</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Bringing fun and fellowship to our church community through exciting quiz games.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/" className="hover:text-foreground transition-colors">Home</Link></li>
                <li><Link href="/auth" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><Link href="/auth?tab=register" className="hover:text-foreground transition-colors">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">For Hosts</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/auth?tab=register&role=host" className="hover:text-foreground transition-colors">Create Account</Link></li>
                <li><Link href="/host/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                <li><Link href="/host/questions" className="hover:text-foreground transition-colors">Manage Questions</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">For Contestants</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/auth?tab=register" className="hover:text-foreground transition-colors">Join Now</Link></li>
                <li><Link href="/contestant/lobby" className="hover:text-foreground transition-colors">Find Games</Link></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="text-center text-sm text-muted-foreground">
            Built with love for our church community &copy; {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  )
}
