/**
 * Google Gemini API Integration for Image Generation
 *
 * Uses Gemini's image generation capabilities to create
 * astronaut-style portraits from user photos.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_AI_API_KEY || "";

// Initialize Google AI
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Transform user photo to astronaut style using Gemini
 * This uses the image editing capabilities of Gemini
 */
export async function transformToAstronaut(
  userPhotoBase64: string,
  userName: string
): Promise<string> {
  try {
    // Use Gemini 2.0 Flash for image generation
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    // First, analyze the photo to understand the person's features
    const analysisResult = await model.generateContent([
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: userPhotoBase64.replace(/^data:image\/\w+;base64,/, ""),
        },
      },
      {
        text: `Analyze this person's face briefly. Describe their key features like hair color, face shape, and expression in 2-3 sentences for reference.`,
      },
    ]);

    const faceDescription = analysisResult.response.text();

    // Generate astronaut image using Imagen 3 (if available) or describe prompt
    // Note: Direct image generation requires Imagen API which may need separate setup
    console.log(`Face analysis for ${userName}:`, faceDescription);

    // For now, return the original image
    // In production, you would:
    // 1. Use Imagen 3 API for image generation
    // 2. Or use a face-swap model with the analysis
    return userPhotoBase64;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

/**
 * Generate an astronaut template image
 * Uses Gemini Imagen to create a base template
 */
export async function generateAstronautTemplate(): Promise<string> {
  try {
    // Use Imagen 3 for image generation
    // Note: This requires the imagegeneration model
    const model = genAI.getGenerativeModel({
      model: "imagen-3.0-generate-002",
    });

    const result = await model.generateContent(
      "Professional astronaut in white NASA spacesuit, portrait style, studio lighting, realistic, high quality, facing camera, neutral expression, space helmet off, ready for ID photo"
    );

    // Extract image from response
    const response = result.response;
    const candidates = response.candidates;

    if (candidates && candidates.length > 0) {
      // Return base64 image data
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if ("inlineData" in part && part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image generated");
  } catch (error) {
    console.error("Imagen API error:", error);
    throw error;
  }
}

/**
 * Simple text generation for testing API connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    // Use gemini-2.0-flash-lite (available in free tier)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const result = await model.generateContent("Say hello in Korean");
    const text = result.response.text();
    console.log("Gemini test response:", text);
    return true;
  } catch (error) {
    console.error("Gemini connection test failed:", error);
    return false;
  }
}
