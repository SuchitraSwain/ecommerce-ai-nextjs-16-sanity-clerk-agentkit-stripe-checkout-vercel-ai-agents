import { createAgentUIStreamResponse, type UIMessage } from "ai";
import { shoppingAgent } from "@/lib/ai/shopping-agent";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  // Verify user is authenticated
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages }: { messages: UIMessage[] } = await request.json();

  return createAgentUIStreamResponse({
    agent: shoppingAgent,
    messages,
  });
}
