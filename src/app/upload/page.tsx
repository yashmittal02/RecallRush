"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Settings, FileText, Upload as UploadIcon, AlertCircle } from "lucide-react";

export default function UploadPage() {
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(10);
  const [timer, setTimer] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();

  useEffect(() => {
    const savedNotes = sessionStorage.getItem("recallrush_notes_raw");
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/plain") {
      setError("Please upload a raw .txt file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setNotes((prev) => prev + "\n" + (event.target?.result as string));
      setError("");
    };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    if (!notes.trim()) {
      setError("Please paste some notes or upload a file first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, count, timer })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate flashcards");
      }

      // Store flashcards in sessionStorage for the game engine
      sessionStorage.setItem("recallrush_flashcards", JSON.stringify(data.flashcards));
      sessionStorage.setItem("recallrush_timer", timer.toString());
      sessionStorage.setItem("recallrush_notes_raw", notes);
      
      router.push("/game");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-6 py-12 flex flex-col md:flex-row gap-8">
      {/* Left Column: Input */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-rose-500" />
            Your Study Notes
          </h2>
          <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300 transition-colors glass-panel px-3 py-1.5 rounded-lg border-rose-500/30">
            <UploadIcon className="w-4 h-4" />
            Upload .txt
            <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
        
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Paste your syllabus, textbook excerpts, or lecture notes here. The AI will convert them into challenging flashcards..."
          className="w-full h-[500px] resize-none bg-black/40 border border-white/10 rounded-2xl p-6 text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all shadow-inner text-lg leading-relaxed placeholder:text-gray-600"
        />
      </div>

      {/* Right Column: Settings & CTA */}
      <div className="w-full md:w-80 flex flex-col gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6">
          <h3 className="text-xl font-bold flex items-center gap-2 border-b border-white/10 pb-4">
            <Settings className="text-gray-400" />
            Game Settings
          </h3>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 flex justify-between">
              Number of Questions <span>{count}</span>
            </label>
            <input 
              type="range" min="5" max="30" step="1" 
              value={count} onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-rose-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300 flex justify-between">
              Timer per Question <span>{timer}s</span>
            </label>
            <input 
              type="range" min="5" max="60" step="5" 
              value={timer} onChange={(e) => setTimer(Number(e.target.value))}
              className="w-full accent-rose-500 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 text-error text-sm px-4 py-3 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 px-6 rounded-2xl transition-all glow-rose disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
        >
          {loading && <Loader2 className="w-6 h-6 animate-spin" />}
          {loading ? "Analyzing Notes..." : "Generate Flashcards"}
        </button>
        
        <p className="text-xs text-gray-500 text-center leading-relaxed px-2">
          Make sure your notes are detailed enough to generate quality MCQs.
        </p>
      </div>
    </div>
  );
}
