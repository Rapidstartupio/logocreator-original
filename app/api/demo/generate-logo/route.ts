import Together from "together-ai";
import { z } from "zod";
import dedent from "dedent";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Move the function outside the POST handler
const generateSingleImage = async (client: Together, prompt: string) => {
  try {
    console.log('Attempting to generate image with prompt:', prompt.substring(0, 100) + '...');
    const response = await client.images.create({
      prompt,
      model: "black-forest-labs/FLUX.1.1-pro",
      width: 768,
      height: 768,
      // @ts-expect-error - this is not typed in the API
      response_format: "base64",
    });
    console.log('Image generation successful');
    return response.data[0].b64_json;
  } catch (error) {
    console.error('Error generating single image:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Image generation failed: ${errorMessage}`);
  }
};

export async function POST(req: Request) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  try {
    const json = await req.json();
    console.log('Request body:', {
      ...json,
      prompt: undefined // Don't log the full prompt for privacy
    });

    const data = z
      .object({
        companyName: z.string(),
        selectedLayout: z.string(),
        selectedStyle: z.string(),
        selectedPrimaryColor: z.string(),
        selectedBackgroundColor: z.string(),
        additionalInfo: z.string().optional(),
        numberOfImages: z.number().default(1),
      })
      .parse(json);

    // Validate Together API key
    if (!process.env.TOGETHER_API_KEY) {
      console.error('Together API key is not configured');
      return Response.json({ error: 'API configuration error' }, { status: 500, headers });
    }

    // Initialize Together client
    const client = new Together({
      apiKey: process.env.TOGETHER_API_KEY,
    });

    console.log('Together client initialized');

    const flashyStyle =
      "Flashy, attention grabbing, bold, futuristic, and eye-catching. Use vibrant neon colors with metallic, shiny, and glossy accents.";

    const techStyle =
      "highly detailed, sharp focus, cinematic, photorealistic, Minimalist, clean, sleek, neutral color pallete with subtle accents, clean lines, shadows, and flat.";

    const modernStyle =
      "modern, forward-thinking, flat design, geometric shapes, clean lines, natural colors with subtle accents, use strategic negative space to create visual interest.";

    const playfulStyle =
      "playful, lighthearted, bright bold colors, rounded shapes, lively.";

    const abstractStyle =
      "abstract, artistic, creative, unique shapes, patterns, and textures to create a visually interesting and wild logo.";

    const minimalStyle =
      "minimal, simple, timeless, versatile, single color logo, use negative space, flat design with minimal details, Light, soft, and subtle.";

    const styleLookup: Record<string, string> = {
      Flashy: flashyStyle,
      Tech: techStyle,
      Modern: modernStyle,
      Playful: playfulStyle,
      Abstract: abstractStyle,
      Minimal: minimalStyle,
    };

    const layoutLookup: Record<string, string> = {
      icon: "Create a single, centered logo design",
      horizontal: "Create a horizontal logo layout. The logo must have two distinct elements side by side: (1) an icon or symbol on the left side, and (2) the company name text on the right side. Both elements should be of equal height and aligned horizontally in the center. Maintain clear spacing between the icon and text.",
      stacked: "Create a stacked logo with the icon above the text",
    };

    const prompt = dedent`A single logo, high-quality, award-winning professional design, made for both digital and print media, only contains a few vector shapes, ${styleLookup[data.selectedStyle]}

${layoutLookup[data.selectedLayout]}

Primary color is ${data.selectedPrimaryColor.toLowerCase()} and background color is ${data.selectedBackgroundColor.toLowerCase()}. The company name is ${data.companyName}, make sure to include the company name in the logo. ${data.additionalInfo ? `Additional info: ${data.additionalInfo}` : ""}`;

    // For demo, limit to 1 image regardless of request
    try {
      const startTime = Date.now();
      const image = await generateSingleImage(client, prompt);

      // Initialize Convex client
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");

      // Save demo logo history
      try {
        await convex.mutation(api.logoHistory.save, {
          companyName: data.companyName,
          layout: data.selectedLayout,
          style: data.selectedStyle,
          primaryColor: data.selectedPrimaryColor,
          backgroundColor: data.selectedBackgroundColor,
          additionalInfo: data.additionalInfo,
          images: [image],
          businessType: data.additionalInfo,
          prompt: prompt,
          styleDetails: styleLookup[data.selectedStyle],
          layoutDetails: layoutLookup[data.selectedLayout],
          numberOfImages: 1, // Demo always generates 1 image
          isDemo: true,
          generationTime: Date.now() - startTime,
          modelUsed: "black-forest-labs/FLUX.1.1-pro",
          status: "success"
        });
      } catch (convexError) {
        console.error('Error saving to Convex:', convexError);
        // Continue even if saving to Convex fails
      }

      return Response.json({ images: [image] }, { headers });
    } catch (error) {
      console.error('Error generating demo logo:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      // Save failed demo attempt
      try {
        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "");
        await convex.mutation(api.logoHistory.save, {
          companyName: data.companyName,
          layout: data.selectedLayout,
          style: data.selectedStyle,
          primaryColor: data.selectedPrimaryColor,
          backgroundColor: data.selectedBackgroundColor,
          additionalInfo: data.additionalInfo,
          images: [],
          businessType: data.additionalInfo,
          prompt: prompt,
          styleDetails: styleLookup[data.selectedStyle],
          layoutDetails: layoutLookup[data.selectedLayout],
          numberOfImages: 1,
          isDemo: true,
          generationTime: 0,
          modelUsed: "black-forest-labs/FLUX.1.1-pro",
          status: "failed",
          errorMessage: errorMessage
        });
      } catch (convexError) {
        console.error('Error saving failed demo attempt to Convex:', convexError);
      }

      return Response.json(
        { error: errorMessage },
        { status: 500, headers }
      );
    }
  } catch (error) {
    console.error('Demo API Error:', error);
    return Response.json(
      { error: 'Failed to generate demo logo' },
      { status: 500, headers }
    );
  }
}

export const runtime = "edge";