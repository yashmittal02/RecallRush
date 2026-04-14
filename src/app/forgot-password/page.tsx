"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Reset failed");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 pb-24">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute -left-20 -top-20 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>

          {!success ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-gray-400 text-sm">Enter your email and a new password to reset your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                  <label className="text-sm font-medium text-gray-300">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all placeholder:text-gray-600"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl transition-all glow-rose disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          ) : (
            <div className="py-12 text-center flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center text-success mb-2">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white">Success!</h2>
              <p className="text-gray-400">Your password has been reset. Redirecting you to login...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
