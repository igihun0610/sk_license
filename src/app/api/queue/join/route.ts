import { NextRequest, NextResponse } from "next/server";
import { joinQueue, generateQueueId } from "@/lib/queue";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const queueId = body.queueId || generateQueueId();

    const status = await joinQueue(queueId);

    return NextResponse.json({
      success: true,
      queueId,
      ...status,
    });
  } catch (error) {
    console.error("Queue join error:", error);
    return NextResponse.json(
      { error: "Failed to join queue", status: "disabled" },
      { status: 500 }
    );
  }
}
