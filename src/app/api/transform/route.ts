import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "AIzaSyCCzDcXjtotVGDHtgeropcHBvrkYLbJ9c4";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

    // Transform image to astronaut style using Nano Banana model
    const prompt = [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      },
      {
        text: `Transform this person into an astronaut portrait photo.

=== HIGHEST PRIORITY: IDENTITY PRESERVATION ===
The person's identity MUST be 100% preserved:
• FACE: Keep every facial feature EXACTLY identical - eyes, nose, lips, chin, jawline, cheekbones, skin tone, wrinkles, moles, freckles
• HAIR: Keep the EXACT same hairstyle, hair color, hair length, hair texture, parting style
• EXPRESSION: Maintain the same facial expression and mood
• This is NON-NEGOTIABLE - the output must be recognizable as the SAME person

=== COMPOSITION: BUST SHOT (CRITICAL) ===
• BUST SHOT FRAMING: Head + Shoulders + Chest area visible
• Frame the subject from mid-chest level to top of head
• This is a PORTRAIT composition - like a formal yearbook photo
• Face should be prominent but NOT fill the entire frame
• Include enough space to show the astronaut suit details on chest/shoulders
• Professional portrait with balanced headroom
• NO helmet or visor - face must be completely visible and unobstructed
• DO NOT crop too tight - we need to see the suit and patches

=== OUTFIT TRANSFORMATION (CRITICAL) ===
• Replace clothing with a WHITE professional astronaut suit

*** SK LOGO - MAIN CHEST LOGO (REQUIRED) ***
• The MAIN logo on the chest must be SK logo (South Korean conglomerate)
• SK logo color: RED letters "SK"
• Place SK logo on the chest area as an embroidered patch sewn onto the suit

• Add a KOREAN FLAG (Taegeukgi/태극기) patch on the chest area
• Include realistic suit details: zippers, life support connectors
• The suit should look authentic and high-quality

=== BACKGROUND & LIGHTING ===
• Cosmic space background with stars and colorful nebula
• Professional studio lighting on the face
• Subtle rim lighting to separate subject from background

=== FINAL OUTPUT ===
Photorealistic, high-quality BUST SHOT portrait of the SAME PERSON wearing an SK astronaut suit in space. Must show head, shoulders, and chest area with visible suit details and patches.`,
      },
    ];

    // Retry logic for API call
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`API attempt ${attempt}/${MAX_RETRIES}`);

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
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

              console.log(`API success on attempt ${attempt}`);
              return NextResponse.json({
                success: true,
                transformedPhotoUrl
              });
            }
          }
        }

        // If no image was generated, return original
        console.log("No image generated, using original");
        return NextResponse.json({
          success: true,
          transformedPhotoUrl: photoUrl,
          message: "Could not generate transformed image, using original"
        });

      } catch (apiError) {
        lastError = apiError instanceof Error ? apiError : new Error(String(apiError));
        console.error(`API attempt ${attempt} failed:`, lastError.message);

        if (attempt < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY}ms...`);
          await sleep(RETRY_DELAY);
        }
      }
    }

    // All retries failed, return original photo as fallback
    console.error("All API attempts failed, using original photo");
    return NextResponse.json({
      success: true,
      transformedPhotoUrl: photoUrl,
      message: "API failed after retries, using original photo"
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
