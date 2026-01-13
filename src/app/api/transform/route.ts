import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "AIzaSyCCzDcXjtotVGDHtgeropcHBvrkYLbJ9c4";

export async function POST(request: NextRequest) {
  try {
    const { photoUrl } = await request.json();

    if (!photoUrl) {
      return NextResponse.json({ error: "Photo URL is required" }, { status: 400 });
    }

    // Extract base64 data from data URL
    const base64Match = photoUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    const mimeType = `image/${base64Match[1]}`;
    const base64Data = base64Match[2];

    // Initialize Google AI client
    const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

    // Transform image to astronaut style
    const prompt = [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      },
      {
        text: `Transform this person's photo into a professional astronaut portrait style.
Keep the person's face exactly the same, but:
- Add a realistic NASA/space agency style astronaut suit
- Add a space helmet (visor up, showing face clearly)
- Use a cosmic space background with stars and nebula
- Make it look like an official astronaut ID photo
- Maintain high quality and professional appearance
- Keep the person's facial features, expression, and likeness identical to the original`,
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: prompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    // Extract the generated image
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const generatedImageData = part.inlineData.data;
          const generatedMimeType = part.inlineData.mimeType || "image/png";
          const transformedPhotoUrl = `data:${generatedMimeType};base64,${generatedImageData}`;

          return NextResponse.json({
            success: true,
            transformedPhotoUrl
          });
        }
      }
    }

    // If no image was generated, return original
    return NextResponse.json({
      success: true,
      transformedPhotoUrl: photoUrl,
      message: "Could not generate transformed image, using original"
    });

  } catch (error) {
    console.error("Transform API error:", error);
    return NextResponse.json(
      {
        error: "Failed to transform image",
        details: error instanceof Error ? error.message : "Unknown error",
        // Fallback to original image
        transformedPhotoUrl: null
      },
      { status: 500 }
    );
  }
}
