import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// ── Signature verification ────────────────────────────────────────────────────
function verifySignature(rawBody: string, signatureHeader: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;
  const [timestampPart, ...sigParts] = signatureHeader.split(",");
  const timestamp = timestampPart.split("=")[1];
  if (!timestamp) throw new Error("Missing timestamp");

  const payload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const provided = sigParts.find((s) => s.startsWith("v1="))?.split("=")[1];

  if (!provided || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) {
    throw new Error("Invalid Stripe signature");
  }
  return JSON.parse(rawBody) as Stripe.Event;
}

// ── Event handlers ────────────────────────────────────────────────────────────
const PLAN_MAP: Record<string, string> = {
  nexus_prime:    "Nexus Prime",
  apex_vital:     "Apex Vital",
  circadian_forge: "Circadian Forge",
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = verifySignature(rawBody, req.headers.get("stripe-signature") ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  console.log(`[webhook] Received: ${event.type}`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("[webhook] ✅ checkout.session.completed", {
        customer: session.customer,
        plan:     session.metadata?.plan ?? "unknown",
        billing:  session.metadata?.billing ?? "unknown",
      });
      // TODO: create account, send welcome email, trigger fulfillment, grant Discord/Slack access
      break;
    }

    case "invoice.payment_succeeded": {
      console.log("[webhook] ✅ invoice.payment_succeeded");
      // TODO: mark subscription active, unlock content
      break;
    }

    case "invoice.payment_failed": {
      console.warn("[webhook] ⚠️ invoice.payment_failed");
      // TODO: send dunning email, suspend access after N attempts
      break;
    }

    case "customer.subscription.deleted": {
      console.log("[webhook] 🗑 customer.subscription.deleted");
      // TODO: mark subscription cancelled, begin cancellation countdown
      break;
    }

    default:
      // Ignore all other event types
      console.log(`[webhook] ⏭  Unhandled: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
