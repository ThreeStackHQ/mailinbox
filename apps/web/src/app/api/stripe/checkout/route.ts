export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { stripe, getOrCreateStripeCustomer } from "../../../../lib/stripe";
import { db, users } from "@mailinbox/db";
import { eq } from "drizzle-orm";
import { APP_URL } from "@mailinbox/config";

const PRO_PRICE_ID = process.env["STRIPE_PRO_PRICE_ID"];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!PRO_PRICE_ID) {
      return NextResponse.json(
        { error: "Stripe price not configured" },
        { status: 500 },
      );
    }

    // Fetch user from DB
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.plan === "pro") {
      return NextResponse.json(
        { error: "Already on Pro plan" },
        { status: 400 },
      );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      user.id,
      user.email,
      user.stripeCustomerId,
    );

    // Persist customerId if newly created
    if (!user.stripeCustomerId) {
      await db
        .update(users)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(users.id, user.id));
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/dashboard/settings?upgraded=true`,
      cancel_url: `${APP_URL}/dashboard/settings?canceled=true`,
      metadata: {
        userId: user.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[stripe/checkout] error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
