import { NextRequest, NextResponse } from "next/server";
import { createJob } from "@/lib/jobStore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { photoUrl, name, company, commitment } = body;

    // Validate required fields
    if (!photoUrl || !name || !company || !commitment) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create job and start processing
    const jobId = createJob({
      photoUrl,
      name,
      company,
      commitment,
    });

    return NextResponse.json({ jobId, status: "pending" });
  } catch (error) {
    console.error("Process API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
