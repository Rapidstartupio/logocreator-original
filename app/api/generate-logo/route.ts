import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import dedent from "dedent";
import Together from "together-ai";
import { z } from "zod";

let ratelimit: Ratelimit | undefined;

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

  const user = await currentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
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

  // Add rate limiting if Upstash API keys are set & no BYOK, otherwise skip
  if (process.env.UPSTASH_REDIS_REST_URL && !data.userAPIKey) {
    // Add https:// prefix if not present
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL.startsWith('https://')
      ? process.env.UPSTASH_REDIS_REST_URL
      : `https://${process.env.UPSTASH_REDIS_REST_URL}`;

    ratelimit = new Ratelimit({
      redis: new Redis({
        url: redisUrl,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      // Allow 3 requests per 2 months on prod
      limiter: Ratelimit.fixedWindow(30, "60 d"),
      analytics: true,
      prefix: "logocreator",
    });
  }

  // Initialize Together client with environment API key by default
  const options: ConstructorParameters<typeof Together>[0] = {
    apiKey: process.env.TOGETHER_API_KEY
  };
  
  if (process.env.HELICONE_API_KEY) {
    options.baseURL = "https://together.helicone.ai/v1";
    options.defaultHeaders = {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Helicone-Property-LOGOBYOK": data.userAPIKey ? "true" : "false",
    };
  }

  if (!options.apiKey) {
    console.error('No Together API key found in environment variables');
    return new Response("Server configuration error: Together API key not found", { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  console.log('Together client options:', {
    hasApiKey: Boolean(options.apiKey),
    keyFirstChars: options.apiKey ? `${options.apiKey.substring(0, 4)}...` : 'none',
    keyLength: options.apiKey?.length,
  });

  // Create the client with logging
  const client = new Together(options);

  console.log('Together client created');

  const clerkClientInstance = await clerkClient();
  if (data.userAPIKey) {
    await clerkClientInstance.users.updateUserMetadata(user.id, {
      unsafeMetadata: {
        remaining: "BYOK",
        hasApiKey: true,
      },
    });
  } else {
    // Handle rate limiting for non-BYOK users
    if (ratelimit) {
      const { success, remaining } = await ratelimit.limit(user.id);
      await clerkClientInstance.users.updateUserMetadata(user.id, {
        unsafeMetadata: {
          hasApiKey: false,
          remaining,
        },
      });

      if (!success) {
        return new Response(
          "You've used up all your credits. Enter your own Together API Key to generate more logos.",
          {
            status: 429,
            headers: { "Content-Type": "text/plain" },
          },
        );
      }
    }
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
      const response = await client.images.create({
        prompt,
        model: "black-forest-labs/FLUX.1.1-pro",
        width: 768,
        height: 768,

        // @ts-expect-error - this is not typed in the API
        response_format: "base64",
      });
      return response.data[0].b64_json;
    } catch (error) {
      console.error('Error generating single image:', error);
      throw error;
    }
  }

  try {
    const numberOfImages = data.numberOfImages || 1;
    console.log('Generating images with prompt:', prompt); // Debug log
    
    // Generate images sequentially instead of in parallel to avoid rate limits
    const images = [];
    for (let i = 0; i < numberOfImages; i++) {
      const image = await generateSingleImage();
      images.push(image);
    }
    
    return Response.json(images, { status: 200 });
  } catch (error) {
    console.error('Error in main try block:', error); // Debug log

    const invalidApiKey = z
      .object({
        error: z.object({
          error: z.object({ code: z.literal("invalid_api_key") }),
        }),
      })
      .safeParse(error);

    if (invalidApiKey.success) {
      return new Response("Your API key is invalid.", {
        status: 401,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const modelBlocked = z
      .object({
        error: z.object({
          error: z.object({ type: z.literal("request_blocked") }),
        }),
      })
      .safeParse(error);

    if (modelBlocked.success) {
      return new Response(
        "Your Together AI account needs a credit card on file to use this app. Please add a credit card at: https://api.together.xyz/settings/billing",
        {
          status: 403,
          headers: { "Content-Type": "text/plain" },
        },
      );
    }

    // Add additional error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }

    // If it's not one of our known errors, throw it
    throw error;
  }
}

export const runtime = "edge";
