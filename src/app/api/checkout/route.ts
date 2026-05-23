import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// Three-tier catalog — matches the 3 paid tiers on the landing page
// Price IDs are created in Stripe Dashboard; set them as env vars or replace here.
const PRICING_TIERS: Record<
  string,
  {
    monthlyPriceId: string;
    annualPriceId: string;
    name: string;
    label: string;
    monthly: number;
    annual: number;
  }
> = {
  nexus_prime: {
    monthlyPriceId: process.env.STRIPE_PRICE_NEXUS_MONTHLY ?? "price_nexus_monthly",
    annualPriceId:  process.env.STRIPE_PRICE_NEXUS_ANNUAL  ?? "price_nexus_annual",
    name: "Nexus Prime",
    label: "Focus & Mental Performance",
    monthly: 8900,
    annual:  7100,
  },
  apex_vital: {
    monthlyPriceId: process.env.STRIPE_PRICE_APEX_MONTHLY ?? "price_apex_monthly",
    annualPriceId:  process.env.STRIPE_PRICE_APEX_ANNUAL  ?? "price_apex_annual",
    name: "Apex Vital",
    label: "Energy & Recovery",
    monthly: 12900,
    annual:  10300,
  },
  circadian_forge: {
    monthlyPriceId: process.env.STRIPE_PRICE_CIRCADIAN_MONTHLY ?? "price_circadian_monthly",
    annualPriceId:  process.env.STRIPE_PRICE_CIRCADIAN_ANNUAL  ?? "price_circadian_annual",
    name: "Circadian Forge",
    label: "Sleep & Longevity",
    monthly: 10900,
    annual:  8700,
  },
};

export async function POST(req: NextRequest) {
  try {
    const { plan, billing = "monthly" } = (await req.json()) as {
      plan: keyof typeof PRICING_TIERS;
      billing?: "monthly" | "annual";
    };

    const tier = PRICING_TIERS[plan];
    if (!tier) {
      return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
    }

    const priceId = billing === "annual" ? tier.annualPriceId : tier.monthlyPriceId;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/`,
      metadata:    { plan, billing, source: "vitaforge-landing" },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Error:", err);
    return NextResponse.json({ error: "Checkout failed." }, { status: 500 });
  }
}
