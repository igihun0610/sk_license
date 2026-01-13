import { NextRequest, NextResponse } from "next/server";
import { getQueueStatus } from "@/lib/queue";

export async function GET(request: NextRequest) {
  try {
    const queueId = request.nextUrl.searchParams.get("queueId");

    if (!queueId) {
      return NextResponse.json(
        { error: "Queue ID is required" },
        { status: 400 }
      );
    }

    const status = await getQueueStatus(queueId);

    return NextResponse.json({
      success: true,
      queueId,
      ...status,
    });
  } catch (error) {
    console.error("Queue status error:", error);
    return NextResponse.json(
      { error: "Failed to get queue status", status: "disabled" },
      { status: 500 }
    );
  }
}
