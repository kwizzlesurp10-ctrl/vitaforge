# VitaForge

**AI-Powered Digital Biohacking Protocols** — Next.js + Stripe Checkout (3-tier recurring)

Live demo: https://github.com/kwizzlesurp10-ctrl/vitaforge

---

## Features

- ✅ **3 Digital Subscription Tiers**
  - Nexus Prime ($89/mo · $71/yr)
  - Apex Vital ($129/mo · $103/yr)
  - Circadian Forge ($109/mo · $87/yr)
- ✅ Monthly + Annual billing toggle (20% discount)
- ✅ Stripe Checkout (hosted)
- ✅ Digital-only delivery (Dashboard + Downloadable protocols)
- ✅ Webhook ready (`checkout.session.completed`, subscriptions)
- ✅ Responsive landing + AI Scan quiz
- ✅ Production-ready on Vercel

---

## Quick Start

```bash
git clone https://github.com/kwizzlesurp10-ctrl/vitaforge.git
cd vitaforge
cp .env.local.example .env.local
# Fill your Stripe keys + Price IDs
npm install
npm run dev
```

---

## Stripe Setup (Required)

1. Create 3 recurring **Service** products in Stripe:

   | Product            | Monthly | Annual | Description                              |
   |--------------------|---------|--------|------------------------------------------|
   | `Nexus Prime`      | $89     | $71    | Focus & neurotransmitter optimization    |
   | `Apex Vital`       | $129   | $103   | Energy & recovery optimization           |
   | `Circadian Forge`  | $109   | $87    | Sleep & longevity optimization           |

2. Copy the **6 Price IDs** into `.env.local`

3. Create a **Webhook** endpoint:
   ```
   https://your-vercel-domain.vercel.app/api/stripe-webhook
   ```
   Events: `checkout.session.completed`, `invoice.payment_*`, `customer.subscription.deleted`

---

## Environment Variables

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

STRIPE_PRICE_NEXUS_MONTHLY=price_...
STRIPE_PRICE_NEXUS_ANNUAL=price_...
STRIPE_PRICE_APEX_MONTHLY=price_...
STRIPE_PRICE_APEX_ANNUAL=price_...
STRIPE_PRICE_CIRCADIAN_MONTHLY=price_...
STRIPE_PRICE_CIRCADIAN_ANNUAL=price_...

STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Add the environment variables above in the Vercel dashboard.

---

## Digital vs Physical

All plans are configured as **digital service subscriptions** (dashboard + downloadable protocols). Physical supplement shipping can be added later as an add-on or separate product.

---

## License

MIT — Built for production use.