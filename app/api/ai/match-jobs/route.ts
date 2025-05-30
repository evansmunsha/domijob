import { generateAIResponse } from "@/app/utils/openai"



export async function POST(req: Request) {
  try {
    const { systemPrompt, userPrompt } = await req.json()
    const userId = getUserIdFromSessionOrHeader(req) // <-- however you're passing userId

    if (!systemPrompt || !userPrompt || !userId) {
      console.error("Missing required input", { systemPrompt, userPrompt, userId })
      return new Response("Missing required input", { status: 400 })
    }

    const result = await generateAIResponse(
      userId,
      "match-jobs",
      systemPrompt,
      userPrompt,
      {
        temperature: 0.5,
        cache: true,
        signal: req.signal,
      }
    )

    return Response.json(result)
  } catch (err) {
    console.error("❌ Error in /api/ai/match-jobs", err)
    return new Response("AI resume analysis failed", { status: 500 })
  }
}
function getUserIdFromSessionOrHeader(req: Request): string | null {
  // Attempt to retrieve userId from session (assuming a session mechanism exists)
  const session = (req as any).session; // Replace with actual session retrieval logic
  if (session && session.userId) {
    return session.userId;
  }

  // Fallback to checking headers for userId
  const userIdFromHeader = req.headers.get("x-user-id");
  if (userIdFromHeader) {
    return userIdFromHeader;
  }

  // If no userId is found, return null
  return null;
}


