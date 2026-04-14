import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        gameSessions: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate overall stats
    const totalGames = user.gameSessions.length;
    const totalScore = user.gameSessions.reduce((acc, curr) => acc + curr.score, 0);
    const avgAccuracy = totalGames > 0 
      ? user.gameSessions.reduce((acc, curr) => acc + curr.accuracy, 0) / totalGames 
      : 0;

    return NextResponse.json({
      history: user.gameSessions,
      stats: {
        xp: user.xp,
        level: user.level,
        totalGames,
        totalScore,
        avgAccuracy: Math.round(avgAccuracy)
      }
    });

  } catch (error) {
    console.error("Fetch history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
