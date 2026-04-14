"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Gamepad2, LogOut, User as UserIcon } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Gamepad2 className="w-6 h-6 text-rose-500 group-hover:text-rose-400 transition-colors" />
          <span className="font-bold text-xl tracking-tight text-white group-hover:text-gray-200 transition-colors">RecallRush</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          {session ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-1">
                <UserIcon className="w-4 h-4" /> Dashboard
              </Link>
              <Link href="/upload" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">New Game</Link>
              <button 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm font-medium text-error hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/upload" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Play as Guest</Link>
              <Link href="/login" className="text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors">Login / Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
