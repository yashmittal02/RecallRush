"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Heart, ArrowRight } from "lucide-react";

interface Flashcard {
  question: string;
  options: string[];
  correctIndex: number;
}

export default function GamePage() {
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [timerDuration, setTimerDuration] = useState(15);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Game specific state
  const [position, setPosition] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);

  // Flashcard Modal State
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [cardOutcome, setCardOutcome] = useState<{ jump: number; exact: boolean; message: string } | null>(null);
  const [activeBridge, setActiveBridge] = useState<{ type: "snake" | "ladder", start: number, end: number } | null>(null);
  const [mistakes, setMistakes] = useState<{ question: string; correct: string }[]>([]);

  // Parse Flashcards on mount
  useEffect(() => {
    try {
      const rawCards = sessionStorage.getItem("recallrush_flashcards");
      const rawTimer = sessionStorage.getItem("recallrush_timer");

      if (!rawCards) {
        router.replace("/upload");
        return;
      }
      setFlashcards(JSON.parse(rawCards));
      const t = rawTimer ? parseInt(rawTimer) : 15;
      setTimerDuration(t);
      setTimeLeft(t);
      setIsLoaded(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  }, [router]);

  const processAnswerResult = useCallback((isCorrect: boolean) => {
    let jump = 0;
    let message = "";

    if (isCorrect) {
      jump = diceValue;
      message = `Correct! +${diceValue} Tiles (Ladder)`;
    } else {
      jump = -diceValue;
      message = `Wrong! -${diceValue} Tiles (Snake)`;
    }

    setCardOutcome({ jump, exact: false, message });
    if (isCorrect) {
      setScore((s) => s + diceValue);
    } else {
      setScore((s) => Math.max(0, s - diceValue));
      setLives((l) => Math.max(0, l - 1));
      // Track mistake
      setMistakes((prev) => [
        ...prev,
        { 
          question: flashcards[qIndex].question, 
          correct: flashcards[qIndex].options[flashcards[qIndex].correctIndex] 
        }
      ]);
    }
  }, [diceValue, flashcards, qIndex]);

  const handleTimeExpired = useCallback(() => {
    processAnswerResult(false); // slow wrong
  }, [processAnswerResult]);

  // Timer logic for flashcards
  useEffect(() => {
    let int: NodeJS.Timeout;
    if (showFlashcard && timeLeft > 0 && !cardOutcome) {
      int = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    } else if (timeLeft === 0 && !cardOutcome) {
      handleTimeExpired();
    }
    return () => clearInterval(int);
  }, [showFlashcard, timeLeft, cardOutcome, handleTimeExpired]);

  const submitAnswer = (idx: number) => {
    const isCorrect = idx === flashcards[qIndex].correctIndex;
    processAnswerResult(isCorrect);
  };

  const continueAfterFlashcard = () => {
    if (cardOutcome) {
      const newPos = Math.max(1, Math.min(100, position + cardOutcome.jump));
      setShowFlashcard(false);

      if (cardOutcome.jump !== 0) {
        setActiveBridge({
          type: cardOutcome.jump > 0 ? "ladder" : "snake",
          start: position,
          end: newPos
        });

        // Frame motion naturally springs diagonally!
        setPosition(newPos);

        setTimeout(() => {
          setActiveBridge(null);
          setTimeout(finishQuestionFlow, 300);
        }, 1500);
      } else {
        finishQuestionFlow();
      }
    } else {
      setShowFlashcard(false);
      finishQuestionFlow();
    }
  };

  const finishQuestionFlow = () => {
    setCardOutcome(null);
    setQIndex((p) => p + 1);
    setTimeLeft(timerDuration);

    // Check game over
    if (qIndex + 1 >= flashcards.length || lives <= 0) {
      saveGameResults();
    }
  };

  const saveGameResults = async () => {
    const finalAccuracy = Math.round(((flashcards.length - mistakes.length) / flashcards.length) * 100);
    const notesContent = sessionStorage.getItem("recallrush_notes_raw") || ""; // Need to ensure we save this in upload page

    const results = {
      score,
      accuracy: finalAccuracy,
      timeSpent: (flashcards.length - qIndex) * timerDuration, // Rough estimate
      notesContent,
      mistakes,
      title: notesContent.slice(0, 30) + (notesContent.length > 30 ? "..." : "")
    };

    // Store in Session Storage for Dashboard (Legacy/Backup)
    sessionStorage.setItem("recallrush_score", score.toString());
    sessionStorage.setItem("recallrush_lives", lives.toString());
    sessionStorage.setItem("recallrush_mistakes", JSON.stringify(mistakes));

    try {
      await fetch("/api/game/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(results)
      });
    } catch (e) {
      console.error("Failed to save to DB", e);
    }

    router.push("/dashboard");
  };

  const rollDice = () => {
    if (isRolling || showFlashcard || qIndex >= flashcards.length || lives <= 0) return;
    setIsRolling(true);

    let rolls = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 10) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalRoll);
        finishRoll(finalRoll);
      }
    }, 100);
  };

  const finishRoll = (roll: number) => {
    let currentStep = position;
    const newPos = Math.min(100, position + roll);
    setIsRolling(false);

    const stepInterval = setInterval(() => {
      currentStep++;
      setPosition(currentStep);

      if (currentStep >= newPos) {
        clearInterval(stepInterval);
        setTimeout(() => setShowFlashcard(true), 600);
      }
    }, 300);
  };

  // Board Calculation
  const boardCells = Array.from({ length: 100 }).map((_, i) => {
    const r = Math.floor(i / 10);
    const c = i % 10;
    const virtualRow = 9 - r;
    const num = virtualRow % 2 === 0 ? virtualRow * 10 + c + 1 : virtualRow * 10 + (9 - c) + 1;
    let bgColor = "bg-white/5";
    if (num % 2 === 0) bgColor = "bg-white/10";
    return { num, bgColor, r, c };
  });

  // Calculate pawn absolute position based on 'position' State
  const getPawnPos = (pos: number) => {
    if (pos === 0) {
      // Sits directly below tile 1 on the designated Start Pad
      return { left: "0%", top: "100%", opacity: 1 };
    }
    const num = Math.min(100, Math.max(1, pos));
    const virtualRow = Math.floor((num - 1) / 10);
    const c = virtualRow % 2 === 0 ? (num - 1) % 10 : 9 - ((num - 1) % 10);
    const r = 9 - virtualRow;
    return { left: `${c * 10}%`, top: `${r * 10}%`, opacity: 1 };
  };

  const getTileCenter = (pos: number) => {
    const num = Math.min(100, Math.max(1, pos));
    const virtualRow = Math.floor((num - 1) / 10);
    const c = virtualRow % 2 === 0 ? (num - 1) % 10 : 9 - ((num - 1) % 10);
    const r = 9 - virtualRow;
    return { x: c * 10 + 5, y: r * 10 + 5 };
  };

  const renderBridgePath = () => {
    if (!activeBridge) return null;
    const { start, end, type } = activeBridge;
    const p1 = getTileCenter(start);
    const p2 = getTileCenter(end);

    if (type === "ladder") {
      return (
        <g className="animate-pulse" style={{ animationDuration: '0.8s' }}>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#10b981" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#6ee7b7" strokeWidth="1.5" strokeDasharray="3, 2" strokeLinecap="round" />
        </g>
      );
    } else {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      // S-Curve Cubic Bezier for proper snake slither
      const cp1X = p1.x + (dx / 3) + (nx * 15);
      const cp1Y = p1.y + (dy / 3) + (ny * 15);

      const cp2X = p1.x + ((dx * 2) / 3) - (nx * 15);
      const cp2Y = p1.y + ((dy * 2) / 3) - (ny * 15);

      return (
        <g className="animate-pulse" style={{ animationDuration: '0.8s' }}>
          <path d={`M ${p1.x} ${p1.y} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${p2.x} ${p2.y}`} fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
          {/* Snake head / eye marker */}
          <circle cx={p1.x} cy={p1.y} r="3" fill="#991b1b" stroke="#fca5a5" strokeWidth="1" />
        </g>
      );
    }
  };

  if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  if (!isLoaded) return <div className="p-10 text-center text-gray-500">Loading engine...</div>;

  const currentQ = flashcards[qIndex];

  return (
    <div className="flex-1 flex flex-col xl:flex-row gap-8 p-6 max-w-7xl mx-auto w-full relative">

      {/* Board Column */}
      <div className="flex-1 max-w-[800px] aspect-square relative rounded-2xl glass-panel border-4 border-rose-500/20 shadow-[0_0_40px_rgba(99,102,241,0.15)] flex-shrink-0">
        <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 rounded-2xl overflow-hidden">
          {boardCells.map((cell) => (
            <div key={cell.num} className={`flex items-center justify-center border border-black/20 ${cell.bgColor} relative`}>
              <span className="text-white/20 font-bold text-xl">{cell.num}</span>
            </div>
          ))}
        </div>

        {/* The Starting Tile 0 Pad */}
        <div className="absolute w-[10%] h-[10%] flex items-center justify-center bg-rose-600/50 backdrop-blur-md rounded-b-2xl border-x-4 border-b-4 border-rose-500/20" style={{ left: "0%", top: "100%" }}>
          <span className="text-white/50 font-bold text-sm tracking-widest uppercase">Start</span>
        </div>

        {/* Dynamic Bridges */}
        {activeBridge && (
          <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none drop-shadow-2xl" viewBox="0 0 100 100" preserveAspectRatio="none">
            {renderBridgePath()}
          </svg>
        )}

        {/* Pawn Object */}
        <motion.div
          className="absolute w-[10%] h-[10%] p-2 z-20 flex items-center justify-center"
          animate={getPawnPos(position)}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
        >
          <div className="w-full h-full bg-rose-500 rounded-full shadow-[0_0_20px_#f43f5e] border-2 border-white flex items-center justify-center">
            <div className="w-1/2 h-1/2 bg-white rounded-full opacity-50" />
          </div>
        </motion.div>
      </div>

      {/* Sidebar Game State */}
      <div className="w-full xl:w-96 flex flex-col gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-gray-400 text-sm font-medium">Score</span>
              <span className="text-3xl font-bold text-white flex items-center gap-2">
                <Trophy className="text-yellow-500 w-6 h-6" /> {score}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-gray-400 text-sm font-medium">Lives</span>
              <span className="text-3xl font-bold text-error flex items-center justify-end gap-1">
                {Array.from({ length: lives }).map((_, i) => (
                  <Heart fill="currentColor" key={`L${i}`} className="w-6 h-6" />
                ))}
                {lives === 0 && <span className="text-sm">0</span>}
              </span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col items-center">
            <div className="text-center mb-6">
              <span className="text-gray-400 text-sm block mb-2">Question {Math.min(qIndex + 1, flashcards.length)} of {flashcards.length}</span>
              <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${(Math.min(qIndex, flashcards.length) / flashcards.length) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={rollDice}
              disabled={isRolling || showFlashcard}
              className={`w-32 h-32 rounded-3xl ${isRolling ? 'bg-rose-700' : 'bg-rose-600 hover:bg-rose-500'} flex items-center justify-center text-5xl font-bold text-white shadow-xl transition-all shadow-rose-500/50 disabled:opacity-50`}
            >
              {diceValue}
            </button>
            <p className="mt-4 text-gray-400 font-medium">Click to Roll!</p>
          </div>
        </div>
      </div>

      {/* Flashcard Modal */}
      <AnimatePresence>
        {showFlashcard && currentQ && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
            >
              {/* Timer Bar */}
              {!cardOutcome && (
                <div className="h-2 w-full bg-gray-800 absolute top-0 left-0">
                  <div
                    className={`h-full ${timeLeft > 5 ? 'bg-success' : 'bg-error'} transition-all ease-linear`}
                    style={{ width: `${(timeLeft / timerDuration) * 100}%` }}
                  />
                </div>
              )}

              <div className="p-8 md:p-10 text-center">
                {!cardOutcome ? (
                  <>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-8">{currentQ.question}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentQ.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => submitAnswer(idx)}
                          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 p-5 rounded-2xl text-left text-lg text-gray-200 transition-colors flex items-start gap-3"
                        >
                          <span className="font-bold text-rose-400 shrink-0">{["A", "B", "C", "D"][idx]}.</span>
                          <span>{opt}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-10 flex flex-col items-center gap-6">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 ${cardOutcome.jump > 0 ? 'bg-success/20 text-success border-success/30 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : 'bg-error/20 text-error border-error/30 shadow-[0_0_50px_rgba(239,68,68,0.3)]'}`}>
                      {cardOutcome.jump > 0 ? (
                        <svg className="w-16 h-16 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 3v18" /><path d="M18 3v18" /><path d="M6 8h12" /><path d="M6 12h12" /><path d="M6 16h12" />
                        </svg>
                      ) : (
                        <svg className="w-16 h-16 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2C8 2 4 5 4 10c0 5 8 9 8 13" /><path d="M12 2c4 0 8 3 8 8 0 5-8 9-8 13" /><circle cx="12" cy="6" r="1" fill="currentColor" /><circle cx="9" cy="8" r="0.5" /><circle cx="15" cy="8" r="0.5" />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-3xl font-bold text-white tracking-wide">{cardOutcome.message}</h3>
                    <button
                      onClick={continueAfterFlashcard}
                      className="mt-4 bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 px-8 rounded-full transition-all flex items-center gap-2"
                    >
                      Continue Path <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
