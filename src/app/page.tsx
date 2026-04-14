"use client";

import { ArrowRight, Brain, Gamepad2, Zap, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-black via-[#0a0a0a] to-[#121212] overflow-hidden relative">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0" />
      
      <div className="z-10 max-w-4xl w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-sm text-rose-300 mb-4 animate-fade-in-up">
          <Zap className="w-4 h-4" />
          <span>Powered by Gemini 1.5 Flash</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-2xl">
          Learn by <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-purple-500">Playing.</span>
        </h1>
        
        <p className="text-lg md:text-2xl text-gray-400 max-w-2xl mx-auto">
          Upload your notes and let AI turn them into an interactive game of snake and ladders. 
          Master your subjects up to 3x faster.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          {session ? (
            <>
              <Link 
                href="/upload" 
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-white bg-rose-600 rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95 glow-rose"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Enter Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              
              <button 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-gray-300 glass-panel rounded-full hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                href="/login" 
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-white bg-rose-600 rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95 glow-rose"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Login / Sign Up
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              
              <Link 
                href="/upload" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-gray-300 glass-panel rounded-full hover:bg-white/10 transition-colors"
              >
                Play as Guest
              </Link>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-24 text-left">
          <div className="glass-panel p-6 rounded-2xl">
            <Brain className="w-10 h-10 text-rose-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">AI Generated Flashcards</h3>
            <p className="text-gray-400 text-sm">Just paste your notes. Our fine-tuned AI extracts key concepts and creates high-quality MCQs instantly.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl">
            <Gamepad2 className="w-10 h-10 text-success mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Gamified Mechanics</h3>
            <p className="text-gray-400 text-sm">Climb ladders by answering fast. Slide down snakes if you&apos;re wrong. Learning has never been this engaging.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/20 rounded-full blur-2xl" />
            <svg className="w-10 h-10 text-purple-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <h3 className="text-xl font-semibold text-white mb-2">Track Your Progress</h3>
            <p className="text-gray-400 text-sm">Earn XP, level up, and analyze your accuracy over time on your personalized dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
