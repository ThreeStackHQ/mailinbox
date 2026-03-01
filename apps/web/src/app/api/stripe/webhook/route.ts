import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "../../../../lib/stripe";
import { db, users, subscriptions } from "@mailinbox/db";
import { eq } from "drizzle-orm";

const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];

// Disable body parsing — Stripe needs the raw body for signature verification
export const config = {
  api: { bodyParser: false },
};

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // Get raw body for signature verification
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpserted(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      default:
        // Ignore unhandled event types
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[stripe/webhook] Error handling event ${event.type}:`, error);
    // Return 500 so Stripe retries
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.warn("[stripe/webhook] checkout.session.completed missing userId metadata");
    return;
  }

  // Update user plan to pro
  await db
    .update(users)
    .set({
      plan: "pro",
      stripeCustomerId: session.customer as string,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  console.log(`[stripe/webhook] User ${userId} upgraded to Pro`);
}

async function handleSubscriptionUpserted(stripeSubscription: Stripe.Subscription) {
  const userId = stripeSubscription.metadata?.userId;
  if (!userId) {
    // Try to find user by customer ID
    const customerId = stripeSubscription.customer as string;
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stripeCustomerId, customerId))
      .limit(1);

    if (!user) {
      console.warn(`[stripe/webhook] No user found for customer ${customerId}`);
      return;
    }

    await upsertSubscription(user.id, stripeSubscription);
    return;
  }

  await upsertSubscription(userId, stripeSubscription);
}

async function upsertSubscription(userId: string, stripeSubscription: Stripe.Subscription) {
  const firstItem = stripeSubscription.items.data[0];
  if (!firstItem) return;

  const isActive =
    stripeSubscription.status === "active" ||
    stripeSubscription.status === "trialing";

  // Upsert subscription record
  await db
    .insert(subscriptions)
    .values({
      userId,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: firstItem.price.id,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    })
    .onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: {
        stripePriceId: firstItem.price.id,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        updatedAt: new Date(),
      },
    });

  // Update user plan based on subscription status
  await db
    .update(users)
    .set({
      plan: isActive ? "pro" : "free",
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  console.log(`[stripe/webhook] Subscription upserted for user ${userId}: ${stripeSubscription.status}`);
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  const customerId = stripeSubscription.customer as string;

  // Find user by customer ID
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);

  if (!user) {
    console.warn(`[stripe/webhook] No user found for deleted subscription (customer: ${customerId})`);
    return;
  }

  // Update subscription record to canceled
  await db
    .update(subscriptions)
    .set({ status: "canceled", updatedAt: new Date() })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id));

  // Downgrade user to free
  await db
    .update(users)
    .set({ plan: "free", updatedAt: new Date() })
    .where(eq(users.id, user.id));

  console.log(`[stripe/webhook] Subscription deleted, user ${user.id} downgraded to Free`);
}
