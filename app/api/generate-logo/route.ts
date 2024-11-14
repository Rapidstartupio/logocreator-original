import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import dedent from "dedent";
import Together from "together-ai";
import { z } from "zod";

let ratelimit: Ratelimit | undefined;

// Add rate limiting if Upstash API keys are set, otherwise skip
if (process.env.UPSTASH_REDIS_REST_URL) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    // Allow 3 requests per month
    limiter: Ratelimit.fixedWindow(3, "30 d"),
    analytics: true,
    prefix: "logocreator",
  });
}

export async function POST(req: Request) {
  const user = await currentUser();

  if (!user) {
    return new Response("", { status: 404 });
  }

  const json = await req.json();
  const data = z
    .object({
      userAPIKey: z.string().optional(),
      companyName: z.string(),
      selectedLayout: z.string(),
      selectedStyle: z.string(),
      selectedPrimaryColor: z.string(),
      selectedBackgroundColor: z.string(),
      additionalInfo: z.string().optional(),
    })
    .parse(json);

  // Add observability if a Helicone key is specified, otherwise skip
  const options: ConstructorParameters<typeof Together>[0] = {};
  if (process.env.HELICONE_API_KEY) {
    options.baseURL = "https://together.helicone.ai/v1";
    options.defaultHeaders = {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Helicone-Property-BYOK": data.userAPIKey ? "true" : "false",
    };
  }

  const client = new Together(options);

  if (data.userAPIKey) {
    client.apiKey = data.userAPIKey;
  }

  if (ratelimit) {
    const identifier = user.id;
    const { success, remaining } = await ratelimit.limit(identifier);
    (await clerkClient()).users.updateUserMetadata(user.id, {
      unsafeMetadata: {
        remaining,
      },
    });

    if (!success) {
      return new Response(
        "You've used up all your credits. Enter your own Together API Key to generate more images.",
        {
          status: 429,
          headers: { "Content-Type": "text/plain" },
        },
      );
    }
  }

  const flashyStyle = dedent`
  The design should be flashy, attention grabbing, bold, and eye-catching.

  Use vibrant colors with metallic, shiny, and glossy accents. It should feel futuristic.

  Feel free to add in neon colors to make the logo pop.`;

  const techStyle = dedent`
  The design should be similar to a tech company logo. Minimalist, clean, and sleek.

  The color palette should be neutral with subtle accents.

  Simple geometric shapes, clean lines, shadows, and flat.
  `;

  const modernStyle = dedent`
  The design should be modern and forward-thinking while embracing flat design.

  Use geometric shapes and clean lines to create a balanced aesthetic.

  The colors should be natural with subtle accents.

  Feel free to use strategic negative space to create visual interest.`;

  const playfulStyle = dedent`
  The design should be playful, lighthearted, and lively.

  Feel free to use bright bold colors with rounded shapes.`;

  const abstractStyle = dedent`
  The design should be abstract, artistic, and creative.

  Use unique shapes, patterns, and textures to create a visually interesting and wild logo.`;

  const minimalStyle = dedent`
  The design should be minimal and simple. It should be timeless and versatile.

  The logo only has a single color and makes use of negative space. Light, soft, and subtle.

  Use flat design with minimal details.`;

  const styleLookup: Record<string, string> = {
    Flashy: flashyStyle,
    Tech: techStyle,
    Modern: modernStyle,
    Playful: playfulStyle,
    Abstract: abstractStyle,
    Minimal: minimalStyle,
  };

  const soloLayout = dedent`
  Do not include any text in the logo`;

  const sideLayout = dedent`
  Write the company name to the right of the logo. Keep the logo on the left. Ensure the text and icon are well-aligned for visual balance.`;

  const stackLayout = dedent`
  Write the company name directly underneath the logo. Keep the logo on top. Ensure vertical alignment with equal emphasis on both text and symbol for a balanced, clean layout.`;

  const layoutLookup: Record<string, string> = {
    Solo: soloLayout,
    Side: sideLayout,
    Stack: stackLayout,
  };

  const prompt = dedent`A single logo that is high-quality made for both digital and print media.

  The logo should look like it was made by an award winning professional design studio. It should only contain a few vector shapes.

  ${layoutLookup[data.selectedLayout]}

  ${styleLookup[data.selectedStyle]}

  Use ${data.selectedPrimaryColor.toLowerCase()} as the main primary color. The background should be ${data.selectedBackgroundColor.toLowerCase()}.

  Here's some additional information to help guide your design:

  The company name is ${data.companyName}.

  ${data.additionalInfo ? data.additionalInfo : ""}`;

  try {
    const response = await client.images.create({
      prompt,
      model: "black-forest-labs/FLUX.1.1-pro",
      width: 768,
      height: 768,
      steps: 4,
      // @ts-expect-error - this is not typed in the API
      response_format: "base64",
    });
    return Response.json(response.data[0], { status: 200 });
  } catch (error) {
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

    throw error;
  }
}

export const runtime = "edge";
