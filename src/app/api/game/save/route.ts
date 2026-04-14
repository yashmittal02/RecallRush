import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const data = await request.json();
    
    const { 
      score, 
      accuracy, 
      timeSpent, 
      notesContent, 
      mistakes, 
      title 
    } = data;

    // We only save permanently if user is logged in
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Guest mode: Data not saved to DB" }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create the game session record
    const gameSession = await prisma.gameSession.create({
      data: {
        userId: user.id,
        score,
        accuracy,
        timeSpent,
        notesContent,
        title: title || `Review: ${new Date().toLocaleDateString()}`,
        mistakes: JSON.stringify(mistakes), // Store mistakes as JSON string
      }
    });

    // Update User XP
    const xpGained = Math.floor(score * 1.5);
    const newXp = user.xp + xpGained;
    const newLevel = Math.floor(newXp / 1000) + 1;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: newXp,
        level: newLevel
      }
    });

    return NextResponse.json({ 
      message: "Game saved successfully", 
      id: gameSession.id,
      xpGained,
      newLevel
    }, { status: 201 });

  } catch (error) {
    console.error("Save game error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
