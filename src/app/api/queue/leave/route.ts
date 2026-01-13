import { NextRequest, NextResponse } from "next/server";
import { leaveQueue } from "@/lib/queue";

export async function POST(request: NextRequest) {
  try {
    const { queueId } = await request.json();

    if (!queueId) {
      return NextResponse.json(
        { error: "Queue ID is required" },
        { status: 400 }
      );
    }

    await leaveQueue(queueId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Queue leave error:", error);
    return NextResponse.json(
      { error: "Failed to leave queue" },
      { status: 500 }
    );
  }
}
