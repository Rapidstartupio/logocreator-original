import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { Redis } from "@upstash/redis";
import Stripe from "stripe";

// Select keys based on environment
const stripeSecretKey = process.env.ENVIRONMENT === 'TEST' 
  ? process.env.STRIPE_TEST_SECRET_KEY! 
  : process.env.STRIPE_SECRET_KEY!;

const stripeWebhookSecret = process.env.ENVIRONMENT === 'TEST'
  ? process.env.STRIPE_TEST_WEBHOOK_SECRET!
  : process.env.STRIPE_WEBHOOK_SECRET!;

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-11-20.acacia",
});

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      return new NextResponse(`Webhook Error: ${err instanceof Error ? err.message : "Unknown Error"}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === "checkout.session.completed") {
      if (!session?.metadata?.userId || !session?.metadata?.credits) {
        return new NextResponse("Missing metadata", { status: 400 });
      }

      const userId = session.metadata.userId;
      const creditsToAdd = parseInt(session.metadata.credits);

      // Initialize Redis client
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.startsWith('https://')
        ? process.env.UPSTASH_REDIS_REST_URL
        : `https://${process.env.UPSTASH_REDIS_REST_URL}`;

      const redis = new Redis({
        url: redisUrl!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });

      // Get current credits
      const creditsKey = `logocreator:credits:${userId}`;
      const currentCredits = await redis.get(creditsKey) as string;
      const remainingCredits = currentCredits ? parseInt(currentCredits) : 0;

      // Add new credits
      await redis.set(creditsKey, (remainingCredits + creditsToAdd).toString());

      // Get Clerk client
      const clerk = await clerkClient();

      // Update the user's credits in Clerk
      await clerk.users.updateUserMetadata(userId, {
        unsafeMetadata: {
          remaining: remainingCredits + creditsToAdd,
          hasApiKey: false,
        },
      });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 