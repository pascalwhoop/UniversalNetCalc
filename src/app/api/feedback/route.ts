import { NextRequest, NextResponse } from "next/server"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { auth } from "@/auth"

export const runtime = "edge"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { feedback?: string }
    const feedback = body.feedback

    if (!feedback || typeof feedback !== "string") {
      return NextResponse.json({ error: "Feedback is required" }, { status: 400 })
    }

    // Check if user is authenticated (optional)
    const session = await auth()
    const userEmail = session?.user?.email || "anonymous"

    const ctx = getCloudflareContext()
    const kv = (ctx.env as any).FEEDBACK as KVNamespace

    if (!kv) {
      console.warn("FEEDBACK KV binding not found, logging to console only")
      console.log(`[Feedback][${userEmail}]: ${feedback}`)
      return NextResponse.json({ success: true, message: "Feedback received (local mode)" })
    }

    const timestamp = new Date().toISOString()
    const id = crypto.randomUUID()
    
    // Store as: feedback:user:timestamp:id
    const key = `feedback:${userEmail}:${timestamp}:${id}`
    await kv.put(key, feedback)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Feedback error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
