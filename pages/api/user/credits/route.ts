import { NextResponse } from "next/server";
import { auth } from "@/app/utils/auth";
import { getUserCredits } from "@/app/utils/credits";

export async function GET(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const balance = await getUserCredits(userId);
    
    return NextResponse.json({ balance });
    
  } catch (error) {
    console.error("Error getting user credits:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching user credits" },
      { status: 500 }
    );
  }
} 