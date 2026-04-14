"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Trophy, Target, Play, ShieldAlert, 
  History, BookOpen, ChevronRight, XCircle, 
  RefreshCcw, Star, Zap 
} from "lucide-react";

interface GameHistory {
  id: string;
  title: string;
  score: number;
  accuracy: number;
  timeSpent: number;
  notesContent: string;
  mistakes: string;
  createdAt: string;
}

interface UserStats {
  xp: number;
  level: number;
  totalGames: number;
  totalScore: number;
  avgAccuracy: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Local state for just finished game
  const [lastGameMistakes] = useState<{question: string, correct: string}[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = sessionStorage.getItem("recallrush_mistakes");
    return raw ? JSON.parse(raw) : [];
  });



  useEffect(() => {
    // 2. Fetch persistent history if logged in
    async function fetchData() {
      if (status === "authenticated") {
        try {
          const res = await fetch("/api/game/history");
          const data = await res.json();
          if (res.ok) {
            setHistory(data.history);
            setStats(data.stats);
          }
        } catch (e) {
          console.error("Failed to fetch history", e);
        }
      }
      setLoading(false);
    }

    if (status !== "loading") {
      fetchData();
    }
  }, [status]);

  const handleRestartGame = (notes: string) => {
    sessionStorage.setItem("recallrush_notes_raw", notes);
    router.push("/upload"); // The upload page will have the content pre-filled if we add that logic, or we can go straight to game if we regenerate
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10">
        <Zap className="w-12 h-12 text-rose-500 animate-pulse mb-4" />
        <span className="text-gray-500 font-medium">Loading your Study Hub...</span>
      </div>
    );
  }

  // Calculate XP progress bar
  const xpInLevel = stats ? stats.xp % 1000 : 0;
  const xpProgress = (xpInLevel / 1000) * 100;

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-6 py-12 space-y-10">
      
      {/* 1. Header & XP Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-white tracking-tight">
            Welcome Back{session?.user ? `, ${session.user.email?.split('@')[0]}` : ' Explorer'}!
          </h2>
          <p className="text-gray-400 text-lg">You&apos;ve mastered {stats?.totalGames || 0} topics so far. Keep the streak alive!</p>
        </div>
        
        {stats && (
          <div className="glass-panel p-4 px-6 rounded-2xl min-w-[300px] border-rose-500/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <Star className="w-4 h-4 fill-current" /> Level {stats.level}
              </span>
              <span className="text-gray-500 text-xs font-mono">{xpInLevel} / 1000 XP</span>
            </div>
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)] transition-all duration-1000"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: History & Mistakes */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Mistake Review Card (Only shows if there are mistakes from last game) */}
          {lastGameMistakes.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl border border-rose-500/30 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldAlert className="w-32 h-32" />
              </div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <XCircle className="text-error w-6 h-6" />
                Mistake Review (Last Game)
              </h3>
              <div className="space-y-4 relative z-10">
                {lastGameMistakes.slice(0, 3).map((m, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2 hover:bg-white/10 transition-colors">
                    <p className="text-gray-300 font-medium leading-snug">{m.question}</p>
                    <p className="text-sm font-bold text-success flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" /> Correct Answer: {m.correct}
                    </p>
                  </div>
                ))}
                {lastGameMistakes.length > 3 && (
                  <button className="text-sm text-rose-400 font-bold hover:underline">
                    + {lastGameMistakes.length - 3} more mistakes to review
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Match History Table */}
          <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <History className="text-rose-500 w-5 h-5" /> Recent Matches
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest font-bold">
                  <tr>
                    <th className="px-6 py-4">Topic</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Accuracy</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.length > 0 ? history.map((session) => (
                    <tr key={session.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-medium text-white max-w-[200px] truncate">{session.title}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                          <Zap className="w-3 h-3 fill-current" /> {session.score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={session.accuracy > 70 ? 'text-success' : 'text-yellow-500'}>{session.accuracy}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">No games played yet. Click &quot;Play New Game&quot; to start!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Stats & Saved Notes */}
        <div className="space-y-8">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-2xl flex flex-col gap-1 items-center justify-center text-center">
              <Trophy className="text-yellow-500 w-6 h-6 mb-1" />
              <span className="text-2xl font-black text-white">{stats?.totalScore || 0}</span>
              <span className="text-[10px] uppercase tracking-tighter text-gray-500 font-bold">Total Pts</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl flex flex-col gap-1 items-center justify-center text-center">
              <Target className="text-success w-6 h-6 mb-1" />
              <span className="text-2xl font-black text-white">{stats?.avgAccuracy || 0}%</span>
              <span className="text-[10px] uppercase tracking-tighter text-gray-500 font-bold">Avg Accuracy</span>
            </div>
          </div>

          {/* Saved Notes Archive */}
          <div className="glass-panel rounded-3xl p-6 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="text-rose-500 w-5 h-5" /> Saved Notes
            </h3>
            <div className="space-y-4">
              {history.filter(h => h.notesContent).length > 0 ? history.filter(h => h.notesContent).slice(0, 5).map((session) => (
                <div key={session.id} className="group p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-rose-500/30 transition-all flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-gray-300 font-bold text-sm truncate">{session.title}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black">{session.notesContent?.length || 0} characters</p>
                  </div>
                  <button 
                    onClick={() => handleRestartGame(session.notesContent)}
                    className="p-2 bg-rose-600/10 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                    title="Play Again"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                </div>
              )) : (
                <p className="text-center text-gray-600 text-sm py-4">Your uploaded notes will appear here once you play a game.</p>
              )}
              
              <Link href="/upload" className="w-full flex items-center justify-center gap-2 py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-rose-900/20">
                <Play className="w-4 h-4 fill-current" /> Play New Topic
              </Link>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] mb-4">Account Actions</p>
            <div className="flex gap-2 text-center">
              <Link href="/dashboard" className="flex-1 text-sm font-bold text-gray-400 glass-panel py-3 rounded-xl hover:text-white transition-colors">Settings</Link>
              <button 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex-1 text-sm font-bold text-error glass-panel py-3 rounded-xl hover:bg-error/10 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
