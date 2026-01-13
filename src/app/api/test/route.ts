import { NextResponse } from "next/server";
import { testConnection } from "@/lib/ai/gemini";

export async function GET() {
  try {
    const isConnected = await testConnection();

    if (isConnected) {
      return NextResponse.json({
        status: "success",
        message: "Google AI API connection successful!",
      });
    } else {
      return NextResponse.json(
        { status: "error", message: "Connection failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API test error:", error);
    return NextResponse.json(
      { status: "error", message: String(error) },
      { status: 500 }
    );
  }
}
