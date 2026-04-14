import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { notes, count = 10, timer } = body;

    if (!notes || notes.trim() === "") {
      return NextResponse.json({ error: "Notes content is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes("your_api_key_here")) {
      console.log("Using Mock Flashcards since no valid API Key was found.");
      // Fallback for easy testing without an API key
      const mockCards = Array.from({ length: count }).map((_, i) => ({
        question: `Mock Question ${i + 1}: What is the core concept being discussed?`,
        options: ["A very convincing distractor", "The absolutely correct answer", "Another plausible but wrong distractor", "A completely wrong answer"],
        correctIndex: 1
      }));
      return NextResponse.json({ flashcards: mockCards, timer: timer || 15 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      You are an expert educational AI. 
      I will provide you with study notes. Please generate exactly ${count} multiple-choice questions based on these notes.
      
      Return the output as a strict JSON array of objects.
      DO NOT wrap the response in markdown blocks like \`\`\`json. Return ONLY valid JSON.
      
      Each object must follow this exact structure:
      {
        "question": "The question text here",
        "options": ["First option", "Second option", "Third option", "Fourth option"],
        "correctIndex": 0
      }
      
      DO NOT prefix the options with A, B, C, D numbers or letters. Just provide the raw text for the option.

      Study notes:
      "${notes}"
    `;

    const result = await model.generateContent(prompt);
    let outputText = result.response.text();
    
    // Clean up potential markdown formatting if the model fails to follow instructions
    outputText = outputText.replace(/```json/g, "").replace(/```/g, "").trim();

    const flashcards = JSON.parse(outputText);

    return NextResponse.json({
      flashcards,
      timer: timer || 15 // defaulting to 15 seconds per question if not specified
    });
  } catch (error: unknown) {
    console.error("Gemini API Error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate flashcards";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
