"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, LayoutDashboard, Users, Wallet, Zap, Shield, TrendingUp } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // If authenticated, push to proper dashboard. Otherwise, show public landing.
  useEffect(() => {
    if (!isLoading && user) {
      const role = user?.role?.toUpperCase() || "";
      const isHR = role === "HR" || user?.groups?.some(g => g.toLowerCase() === "hr");
      const isFinance = role === "FINANCE" || user?.groups?.some(g => g.toLowerCase() === "finance");

      if (isHR) router.push("/dashboard/hr");
      else if (isFinance) router.push("/dashboard/finance");
      else router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary"></div>
          <div className="absolute inset-0 animate-pulse-glow rounded-full"></div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary"></div>
          <div className="absolute inset-0 animate-pulse-glow rounded-full"></div>
        </div>
      </div>
    );
  }

  // Public landing page
  return (
    <div className="min-h-screen bg-background text-white overflow-hidden relative selection:bg-primary/30 selection:text-white">

      {/* Animated Background Gradient Mesh */}
      <div className="fixed inset-0 gradient-mesh animate-gradient opacity-60 pointer-events-none"></div>
      
      {/* Background Gradient Orbs */}
      <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] md:w-[1000px] md:h-[1000px] rounded-full bg-gradient-to-t from-primary/40 via-primary/20 to-transparent opacity-50 blur-[100px] pointer-events-none z-0 animate-pulse"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] md:w-[600px] md:h-[600px] rounded-full bg-gradient-to-br from-primary/30 to-transparent opacity-40 blur-[80px] pointer-events-none z-0"></div>

      {/* Navbar */}
      <header className="relative z-50 container mx-auto flex items-center justify-between py-6 px-6 md:px-10 animate-fadeIn">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all-smooth group-hover:scale-105">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gradient">LEXIE ERP</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/70">
          <Link href="#features" className="hover:text-primary transition-all-smooth hover:-translate-y-0.5">Features</Link>
          <Link href="#process" className="hover:text-primary transition-all-smooth hover:-translate-y-0.5">Process</Link>
          <Link href="#case-study" className="hover:text-primary transition-all-smooth hover:-translate-y-0.5">Case Study</Link>
          <Link href="#faqs" className="hover:text-primary transition-all-smooth hover:-translate-y-0.5">FAQs</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden md:block text-sm font-medium text-foreground/70 hover:text-primary transition-all-smooth">Log in</Link>
          <Link href="/register" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all-smooth flex items-center gap-2 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover-lift">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 md:px-10 pt-10 md:pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left Content */}
          <div className="max-w-xl animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-foreground/80">Next-Gen ERP Solution</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
              Manage by <br />
              <span className="text-gradient">Drag & Drop</span>
            </h1>
            
            <p className="text-lg text-foreground/70 mb-10 leading-relaxed max-w-md">
              Streamline HR, Finance, and Audit workflows with our intuitive, role-based ERP system. Built for modern enterprises.
            </p>

            <div className="flex items-center gap-6">
              <Link href="/register" className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all-smooth flex items-center gap-2 shadow-xl shadow-primary/30 hover:shadow-primary/50 hover-lift">
                Get Started <ArrowRight size={18} />
              </Link>
              <div className="flex items-center gap-2 text-sm text-foreground/60">
                <CheckCircle2 size={16} className="text-primary" />
                <span>Free trial available</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-foreground/10">
              <div>
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-foreground/60 mt-1">Companies</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">50K+</div>
                <div className="text-sm text-foreground/60 mt-1">Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-foreground/60 mt-1">Uptime</div>
              </div>
            </div>
          </div>

          {/* Right Content - Glassmorphism Dashboard Mockup */}
          <div className="relative animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            {/* Decorative Elements behind the card */}
            <div className="absolute -top-10 -right-10 w-60 h-60 bg-primary/30 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            {/* The Glass Card */}
            <div className="relative rounded-2xl glass p-6 shadow-2xl shadow-primary/10 hover:shadow-primary/20 transition-all-smooth hover-lift">

              {/* Mock Window Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-400/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-400/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80 border border-green-400/50"></div>
                </div>
                <div className="text-xs text-foreground/50 font-mono">LEXIE Dashboard</div>
              </div>

              {/* Mock Dashboard Content */}
              <div className="grid grid-cols-3 gap-4 h-[300px] md:h-[400px]">

                {/* Column 1: To Do */}
                <div className="glass rounded-lg p-3 flex flex-col gap-3">
                  <div className="text-xs font-semibold text-blue-400 mb-1 px-1 border-l-2 border-blue-400 pl-2">To Do</div>

                  {/* Card 1 */}
                  <div className="bg-white/10 rounded-md p-3 border border-white/10 hover:border-primary/50 transition-all-smooth cursor-pointer group hover:-translate-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={14} className="text-primary/70" />
                      <span className="text-xs text-foreground">New Hire Onboarding</span>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded-full">HR</span>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white/10 rounded-md p-3 border border-white/10 hover:border-primary/50 transition-all-smooth cursor-pointer group hover:-translate-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet size={14} className="text-primary/70" />
                      <span className="text-xs text-foreground">Q3 Financial Report</span>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full">Finance</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: In Progress */}
                <div className="glass rounded-lg p-3 flex flex-col gap-3">
                  <div className="text-xs font-semibold text-primary mb-1 px-1 border-l-2 border-primary pl-2">In Progress</div>

                  {/* Card 3 */}
                  <div className="bg-white/10 rounded-md p-3 border border-white/10 hover:border-primary/50 transition-all-smooth cursor-pointer relative overflow-hidden group hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent skeleton-shimmer pointer-events-none"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <LayoutDashboard size={14} className="text-primary/70" />
                      <span className="text-xs text-foreground">Audit Log Review</span>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">Audit</span>
                    </div>
                    {/* Floating Cursor Mockup */}
                    <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-[10px] px-2 py-1 rounded-full shadow-lg transform translate-x-1 translate-y-1">
                      Admin
                    </div>
                  </div>
                </div>

                {/* Column 3: Approved */}
                <div className="glass rounded-lg p-3 flex flex-col gap-3">
                  <div className="text-xs font-semibold text-green-400 mb-1 px-1 border-l-2 border-green-400 pl-2">Approved</div>

                  {/* Card 4 */}
                  <div className="bg-white/10 rounded-md p-3 border border-white/10 hover:border-green-500/50 transition-all-smooth cursor-pointer opacity-60 hover:opacity-80">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={14} className="text-green-400" />
                      <span className="text-xs text-foreground line-through">Payroll Jan 2024</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="mt-32 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Powerful <span className="text-gradient">Features</span>
            </h2>
            <p className="text-foreground/60 text-lg max-w-2xl mx-auto">
              Everything you need to manage your enterprise efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card rounded-2xl p-8 hover-lift group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-all-smooth">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">HR Management</h3>
              <p className="text-foreground/60 leading-relaxed">
                Complete employee lifecycle management, from onboarding to offboarding with automated workflows.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 hover-lift group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-all-smooth">
                <Wallet className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Finance & Accounting</h3>
              <p className="text-foreground/60 leading-relaxed">
                Real-time financial tracking, budget management, and automated approval workflows.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 hover-lift group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-all-smooth">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Audit & Compliance</h3>
              <p className="text-foreground/60 leading-relaxed">
                Comprehensive audit trails, compliance monitoring, and detailed reporting capabilities.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-foreground/10 py-12">
        <div className="container mx-auto px-6 md:px-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gradient">LEXIE ERP</span>
            </div>
            <div className="text-sm text-foreground/60">
              © {new Date().getFullYear()} LEXIE ERP. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
