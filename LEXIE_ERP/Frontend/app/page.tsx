"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, LayoutDashboard, Users, Wallet } from "lucide-react";

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
      <div className="flex items-center justify-center min-h-screen bg-[#0B1120]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#38BDF8]"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B1120]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#38BDF8]"></div>
      </div>
    );
  }

  // Public landing page
  return (
    <div className="min-h-screen bg-[#0B1120] text-white overflow-hidden relative selection:bg-[#38BDF8] selection:text-black font-sans">

      {/* Background Gradient Orb */}
      <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] md:w-[1000px] md:h-[1000px] rounded-full bg-gradient-to-t from-[#0284c7] via-[#38BDF8] to-transparent opacity-40 blur-[80px] pointer-events-none z-0" />

      {/* Navbar */}
      <header className="relative z-50 container mx-auto flex items-center justify-between py-6 px-6 md:px-10">
        <div className="flex items-center gap-2">
          {/* Simple text logo for now, matching the clean aesthetic */}
          <span className="font-medium text-xl tracking-tight">LEXIE ERP</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#process" className="hover:text-white transition-colors">Process</Link>
          <Link href="#case-study" className="hover:text-white transition-colors">Case Study</Link>
          <Link href="#faqs" className="hover:text-white transition-colors">FAQs</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden md:block text-sm font-medium text-gray-300 hover:text-white transition-colors">Log in</Link>
          <Link href="/register" className="px-5 py-2.5 rounded-full bg-[#38BDF8] text-black text-sm font-semibold hover:bg-[#0EA5E9] transition-colors flex items-center gap-2">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 md:px-10 pt-10 md:pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left Content */}
          <div className="max-w-xl">
            <h1 className="text-5xl md:text-7xl font-medium leading-[1.1] mb-6 tracking-tight">
              Manage by <br />
              <span className="text-white">Drag & Drop</span>
            </h1>
            <p className="text-lg text-gray-400 mb-10 leading-relaxed max-w-md">
              Streamline HR, Finance, and Audit workflows with our intuitive, role-based ERP system. Pause or cancel anytime.
            </p>

            <div className="flex items-center gap-6">
              <Link href="/register" className="px-8 py-4 rounded-full bg-[#38BDF8] text-black font-semibold hover:bg-[#0EA5E9] transition-colors flex items-center gap-2">
                See Plan <ArrowRight size={18} />
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse"></span>
                2 spots left
              </div>
            </div>
          </div>

          {/* Right Content - Glassmorphism Dashboard Mockup */}
          <div className="relative">
            {/* The Glass Card */}
            <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl overflow-hidden">

              {/* Mock Window Controls */}
              <div className="flex items-center gap-2 mb-4 px-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                <div className="ml-4 text-xs text-gray-500 font-mono">Lexie Dashboard</div>
              </div>

              {/* Mock Dashboard Content */}
              <div className="grid grid-cols-3 gap-4 h-[300px] md:h-[400px]">

                {/* Column 1: To Do */}
                <div className="bg-white/5 rounded-lg p-3 flex flex-col gap-3">
                  <div className="text-xs font-medium text-blue-400 mb-1 px-1 border-l-2 border-blue-400 pl-2">To do</div>

                  {/* Card 1 */}
                  <div className="bg-white/10 rounded-md p-3 border border-white/5 hover:border-white/20 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-200">New Hire Onboarding</span>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded">HR</span>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white/10 rounded-md p-3 border border-white/5 hover:border-white/20 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-200">Q3 Financial Report</span>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">Finance</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: In Progress */}
                <div className="bg-white/5 rounded-lg p-3 flex flex-col gap-3">
                  <div className="text-xs font-medium text-[#38BDF8] mb-1 px-1 border-l-2 border-[#38BDF8] pl-2">In Progress</div>

                  {/* Card 3 */}
                  <div className="bg-white/10 rounded-md p-3 border border-white/5 hover:border-white/20 transition-colors cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shimmer pointer-events-none"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <LayoutDashboard size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-200">Audit Log Review</span>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">Audit</span>
                    </div>
                    {/* Floating Cursor Mockup */}
                    <div className="absolute -bottom-2 -right-2 bg-[#38BDF8] text-black text-[10px] px-2 py-1 rounded-full rounded-tl-none shadow-lg z-10 transform translate-x-1 translate-y-1">
                      Admin
                    </div>
                  </div>
                </div>

                {/* Column 3: Approved */}
                <div className="bg-white/5 rounded-lg p-3 flex flex-col gap-3">
                  <div className="text-xs font-medium text-green-400 mb-1 px-1 border-l-2 border-green-400 pl-2">Approved</div>

                  {/* Card 4 */}
                  <div className="bg-white/10 rounded-md p-3 border border-white/5 hover:border-white/20 transition-colors cursor-pointer opacity-60">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-200 line-through">Payroll Jan 2024</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Decorative Elements behind the card */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-500/30 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/30 rounded-full blur-3xl -z-10"></div>
          </div>
        </div>
      </main>
    </div>
  );
}
