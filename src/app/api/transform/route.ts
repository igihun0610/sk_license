import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { startProcessing, completeProcessing } from "@/lib/queue";
import { getNextKey, getAlternativeKey, markKeyFailed, getApiKeys } from "@/lib/apiKeyManager";

const MAX_RETRIES_PER_KEY = 2;
const RETRY_DELAY = 1000; // 1 second
const MAX_KEY_ROTATIONS = 3; // Try up to 3 different keys

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if error is rate limit related
function isRateLimitError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return message.includes("429") ||
         message.includes("rate limit") ||
         message.includes("quota") ||
         message.includes("resource exhausted");
}

// Check if error is auth/key related
function isAuthError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return message.includes("403") ||
         message.includes("401") ||
         message.includes("invalid") ||
         message.includes("api key");
}

export async function POST(request: NextRequest) {
  let queueId: string | undefined;

  try {
    const body = await request.json();
    const { photoUrl } = body;
    queueId = body.queueId;

    if (!photoUrl) {
      return NextResponse.json({ error: "Photo URL is required" }, { status: 400 });
    }

    // Start processing in queue (if queue is enabled)
    if (queueId) {
      const canProcess = await startProcessing(queueId);
      if (!canProcess) {
        return NextResponse.json(
          { error: "Queue is full, please wait", status: "queued" },
          { status: 429 }
        );
      }
    }

    // Extract base64 data from data URL
    const base64Match = photoUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    const mimeType = `image/${base64Match[1]}`;
    const base64Data = base64Match[2];

    // Build the prompt
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

=== POSE (IMPORTANT) ===
• Subject should be in a SLIGHTLY ANGLED pose (not straight-on)
• Turn body slightly to show the ARM with the KOREAN FLAG patch clearly visible
• This angled pose makes the portrait more dynamic and professional
• The flag patch on the arm/shoulder must be prominently displayed

=== OUTFIT TRANSFORMATION (CRITICAL) ===
• Replace clothing with a WHITE professional astronaut suit

*** SK LOGO - MAIN CHEST LOGO (REQUIRED) ***
• The MAIN logo on the chest must be SK logo (South Korean conglomerate)
• SK logo color: RED letters "SK"
• Place SK logo on the chest area as an embroidered patch sewn onto the suit
• The SK logo patch must look NATURALLY attached - like a real fabric patch with subtle stitching
• The patch should follow the contours of the suit fabric, with realistic shadows and lighting
• NOT a flat sticker - must appear as a genuine embroidered/sewn patch integrated into the suit

• Add a KOREAN FLAG (Taegeukgi/태극기) patch on the shoulder or arm area
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

    // Multi-key rotation with retries
    let currentKey = await getNextKey();
    let keyRotations = 0;
    let lastError: Error | null = null;

    const totalKeys = getApiKeys().length;
    console.log(`Starting transform with ${totalKeys} available API keys`);

    while (keyRotations < Math.min(MAX_KEY_ROTATIONS, totalKeys)) {
      if (!currentKey) {
        console.error("No API key available");
        break;
      }

      const keyPrefix = currentKey.substring(0, 10);
      console.log(`Using API key: ${keyPrefix}... (rotation ${keyRotations + 1}/${MAX_KEY_ROTATIONS})`);

      // Initialize Google AI client with current key
      const ai = new GoogleGenAI({ apiKey: currentKey });

      // Retry logic for current key
      for (let attempt = 1; attempt <= MAX_RETRIES_PER_KEY; attempt++) {
        try {
          console.log(`  Attempt ${attempt}/${MAX_RETRIES_PER_KEY} with key ${keyPrefix}...`);

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

                console.log(`SUCCESS with key ${keyPrefix}... on attempt ${attempt}`);

                if (queueId) {
                  await completeProcessing(queueId);
                }
                return NextResponse.json({
                  success: true,
                  transformedPhotoUrl
                });
              }
            }
          }

          // If no image was generated, return original
          console.log("No image generated, using original");
          if (queueId) {
            await completeProcessing(queueId);
          }
          return NextResponse.json({
            success: true,
            transformedPhotoUrl: photoUrl,
            message: "Could not generate transformed image, using original"
          });

        } catch (apiError) {
          lastError = apiError instanceof Error ? apiError : new Error(String(apiError));
          console.error(`  Attempt ${attempt} failed:`, lastError.message);

          // Check if we should switch keys immediately
          if (isRateLimitError(lastError) || isAuthError(lastError)) {
            console.log(`  Key ${keyPrefix}... hit rate limit or auth error, switching to next key`);
            await markKeyFailed(currentKey);
            break; // Exit retry loop, try next key
          }

          // For other errors, retry with same key
          if (attempt < MAX_RETRIES_PER_KEY) {
            console.log(`  Retrying in ${RETRY_DELAY}ms...`);
            await sleep(RETRY_DELAY);
          }
        }
      }

      // Try next key
      keyRotations++;
      if (keyRotations < MAX_KEY_ROTATIONS) {
        const nextKey = await getAlternativeKey(currentKey);
        if (nextKey && nextKey !== currentKey) {
          currentKey = nextKey;
          console.log(`Rotating to next API key...`);
        } else {
          console.log("No alternative keys available");
          break;
        }
      }
    }

    // All keys exhausted, return original photo as fallback
    console.error(`All ${keyRotations} key rotations failed, using original photo`);
    if (queueId) {
      await completeProcessing(queueId);
    }
    return NextResponse.json({
      success: true,
      transformedPhotoUrl: photoUrl,
      message: "API failed after all retries, using original photo"
    });

  } catch (error) {
    console.error("Transform API error:", error);
    if (queueId) {
      await completeProcessing(queueId);
    }
    return NextResponse.json(
      {
        error: "Failed to transform image",
        details: error instanceof Error ? error.message : "Unknown error",
        transformedPhotoUrl: null
      },
      { status: 500 }
    );
  }
}
