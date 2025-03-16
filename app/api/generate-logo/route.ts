import { auth, currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { Redis } from "@upstash/redis";
import dedent from "dedent";
import { Together } from "together-ai";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

interface TogetherError extends Error {
  status?: number;
  response?: {
    data?: {
      error?: string;
    };
  };
}

export async function POST(req: Request) {
  // Add detailed environment logging at the start
  const envKey = process.env.TOGETHER_API_KEY;
  console.log('Environment variables check:', {
    hasTogetherKey: Boolean(envKey),
    keyFirstChars: envKey ? `${envKey.substring(0, 4)}...` : 'none',
    keyLength: envKey?.length,
    allEnvKeys: Object.keys(process.env),
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV
  });

  // Add request logging
  console.log('Incoming request:', {
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  // Get the user session
  const session = await auth();
  const userId = session?.userId;
  if (!userId) {
    console.error('No user session found');
    return Response.json({ error: 'Authentication required' }, { status: 401, headers });
  }

  // Get the user details
  const user = await currentUser();
  if (!user) {
    console.error('User not found');
    return Response.json({ error: 'User not found' }, { status: 404, headers });
  }

  const json = await req.json();
  console.log('Request body:', json);

  const data = z
    .object({
      userAPIKey: z.string().optional(),
      companyName: z.string(),
      selectedLayout: z.string(),
      selectedStyle: z.string(),
      selectedPrimaryColor: z.string(),
      selectedBackgroundColor: z.string(),
      additionalInfo: z.string().optional(),
      numberOfImages: z.number().default(1),
    })
    .parse(json);

  // Make rate limiting optional
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN && !data.userAPIKey) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      const key = `rate_limit:${userId}`;
      const limit = 50;
      const window = 24 * 60 * 60; // 24 hours in seconds

      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, window);
      }

      if (count > limit) {
        return Response.json(
          { error: "You have reached your daily limit. Please try again tomorrow." },
          { status: 429, headers }
        );
      }
    } catch (error) {
      // Log Redis error but continue without rate limiting
      console.warn('Redis rate limiting disabled:', error);
    }
  } else {
    console.log('Skipping rate limiting: Redis not configured or user has API key');
  }

  // Initialize Together client with API key
  const options: { apiKey: string } = {
    apiKey: data.userAPIKey || process.env.TOGETHER_API_KEY || "",
  };

  console.log('Together client options:', {
    hasApiKey: Boolean(options.apiKey),
    keyFirstChars: options.apiKey ? `${options.apiKey.substring(0, 4)}...` : 'none',
    keyLength: options.apiKey?.length,
  });

  // Create the client with logging
  const client = new Together(options);

  console.log('Together client created');

  if (data.userAPIKey) {
    await clerkClient.users.updateUserMetadata(user.id, {
      unsafeMetadata: {
        remaining: "BYOK",
        hasApiKey: true,
      },
    });
  }

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

  async function generateSingleImage() {
    try {
      console.log('Starting image generation with Together API');
      const response = await client.images.create({
        prompt,
        model: "black-forest-labs/FLUX.1.1-pro",
        width: 768,
        height: 768,
        // @ts-expect-error - this is not typed in the API
        response_format: "base64",
      });
      console.log('Successfully generated image');
      return response.data[0].b64_json;
    } catch (error) {
      const togetherError = error as TogetherError;
      console.error('Error generating single image:', {
        message: togetherError.message,
        status: togetherError.status,
        response: togetherError.response?.data
      });
      
      // Handle credit limit specifically
      if (togetherError.status === 402 || (togetherError.response?.data?.error || '').includes('credit')) {
        throw new Error('Credit limit reached. Please check your API key balance.');
      }
      
      throw error;
    }
  }

  try {
    const images = [];
    for (let i = 0; i < data.numberOfImages; i++) {
      const image = await generateSingleImage();
      images.push(image);
    }

    // If user is not using their own API key, decrement their credits
    if (!data.userAPIKey) {
      const metadata = await clerkClient.users.getUser(user.id);
      const currentCredits = metadata.unsafeMetadata?.remaining || 0;
      
      if (typeof currentCredits === 'number' && currentCredits < data.numberOfImages) {
        return Response.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }

      // Update credits in Clerk
      await clerkClient.users.updateUserMetadata(user.id, {
        unsafeMetadata: {
          remaining: typeof currentCredits === 'number' ? currentCredits - data.numberOfImages : 0,
          hasApiKey: false,
        },
      });
    }

    // Update user analytics and save logo history with proper error handling
    try {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (!convexUrl) {
        console.error('Convex URL is not configured');
        throw new Error('API configuration error');
      }
      
      const convex = new ConvexHttpClient(convexUrl);
      await convex.mutation(api.userAnalytics.updateUserAnalytics, {
        email: user.emailAddresses[0].emailAddress,
        companyName: data.companyName,
        businessType: data.additionalInfo
      });

      // Save logo history with all new fields
      const startTime = Date.now();
      await convex.mutation(api.logoHistory.save, {
        companyName: data.companyName,
        layout: data.selectedLayout,
        style: data.selectedStyle,
        primaryColor: data.selectedPrimaryColor,
        backgroundColor: data.selectedBackgroundColor,
        additionalInfo: data.additionalInfo,
        images: images,
        businessType: data.additionalInfo,
        prompt: prompt,
        styleDetails: styleLookup[data.selectedStyle],
        layoutDetails: layoutLookup[data.selectedLayout],
        numberOfImages: data.numberOfImages,
        isDemo: false,
        generationTime: Date.now() - startTime,
        modelUsed: "black-forest-labs/FLUX.1.1-pro",
        status: "success"
      });
    } catch (error) {
      console.error("Error updating Convex:", error);
      // Log the error but continue - we don't want to fail the whole request if just the save fails
      // The user still gets their generated image
    }

    return Response.json(
      { images },
      {
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in logo generation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    // Save failed attempt to logo history
    try {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (!convexUrl) {
        console.error('Convex URL is not configured');
        throw new Error('API configuration error');
      }
      
      const convex = new ConvexHttpClient(convexUrl);
      await convex.mutation(api.logoHistory.save, {
        companyName: data.companyName,
        layout: data.selectedLayout,
        style: data.selectedStyle,
        primaryColor: data.selectedPrimaryColor,
        backgroundColor: data.selectedBackgroundColor,
        additionalInfo: data.additionalInfo,
        images: [],
        // New fields
        businessType: data.additionalInfo,
        prompt: prompt,
        styleDetails: styleLookup[data.selectedStyle],
        layoutDetails: layoutLookup[data.selectedLayout],
        numberOfImages: data.numberOfImages,
        isDemo: false,
        generationTime: 0,
        modelUsed: "black-forest-labs/FLUX.1.1-pro",
        status: "failed",
        errorMessage: errorMessage
      });
    } catch (convexError) {
      console.error("Error saving failed attempt to Convex:", convexError);
    }

    return Response.json(
      { error: errorMessage },
      {
        status: error instanceof Error && (error as TogetherError).status ? (error as TogetherError).status : 500,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export const runtime = "edge";
