import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_AI_API_KEY || "";

export async function GET() {
  try {
    // List available models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );
    const data = await response.json();

    return NextResponse.json({
      status: "success",
      models: data.models?.map((m: { name: string; supportedGenerationMethods: string[] }) => ({
        name: m.name,
        methods: m.supportedGenerationMethods,
      })) || [],
    });
  } catch (error) {
    console.error("Models API error:", error);
    return NextResponse.json(
      { status: "error", message: String(error) },
      { status: 500 }
    );
  }
}
