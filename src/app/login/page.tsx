"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 pb-24">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute -left-20 -top-20 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-400 text-sm">Enter your details to sign in or create an account (OTP is mocked for demo).</p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-5">
          {error && (
            <div className="bg-error/10 border border-error/20 text-error text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all placeholder:text-gray-600"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all placeholder:text-gray-600"
              placeholder="••••••••"
              required
            />
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-rose-400 transition-colors">
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl transition-all glow-rose disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? "Signing in..." : "Sign In or Auto-Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
