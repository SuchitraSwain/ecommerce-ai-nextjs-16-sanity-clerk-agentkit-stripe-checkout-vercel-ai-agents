import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { client, writeClient } from "@/sanity/lib/client";
import { ORDER_BY_STRIPE_PAYMENT_ID_QUERY } from "@/lib/sanity/queries/orders";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not defined");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  console.log("🔔 [Webhook] Received POST request to /api/webhooks/stripe");
  
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  console.log(`[Webhook] Signature present: ${!!signature}`);

  if (!signature) {
    console.error("❌ [Webhook] Missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`✅ [Webhook] Event verified: ${event.type} (id: ${event.id})`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [Webhook] Signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[Webhook] Processing checkout.session.completed for session: ${session.id}`);
      await handleCheckoutCompleted(session);
      break;
    }
    default:
      console.log(`⚠️ [Webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

// GET endpoint for webhook health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Stripe webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const stripePaymentId = session.payment_intent as string;

  console.log(`[Webhook] Processing checkout.session.completed for payment: ${stripePaymentId}`);

  // Check if write token is available
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    console.error(
      "❌ [Webhook] SANITY_API_WRITE_TOKEN is not set. Cannot create order in Sanity."
    );
    console.error(
      "   Order will not be created. Please set SANITY_API_WRITE_TOKEN in your environment variables."
    );
    // Don't throw - return 200 to prevent Stripe retries
    return;
  }

  try {
    // Idempotency check: prevent duplicate processing on webhook retries
    const existingOrder = await client.fetch(ORDER_BY_STRIPE_PAYMENT_ID_QUERY, {
      stripePaymentId,
    });

    if (existingOrder) {
      console.log(
        `[Webhook] Already processed for payment ${stripePaymentId}, skipping`
      );
      return;
    }

    // Extract metadata
    const {
      clerkUserId,
      userEmail,
      sanityCustomerId,
      productIds: productIdsString,
      quantities: quantitiesString,
    } = session.metadata ?? {};

    console.log(`[Webhook] Metadata extracted:`, {
      clerkUserId,
      userEmail,
      sanityCustomerId,
      productIds: productIdsString,
      quantities: quantitiesString,
    });

    if (!clerkUserId || !productIdsString || !quantitiesString) {
      console.error("[Webhook] Missing required metadata in checkout session:", {
        clerkUserId: !!clerkUserId,
        productIds: !!productIdsString,
        quantities: !!quantitiesString,
      });
      return;
    }

    const productIds = productIdsString.split(",");
    const quantities = quantitiesString.split(",").map(Number);

    // Get line items from Stripe
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

    // Build order items array
    const orderItems = productIds.map((productId, index) => ({
      _key: `item-${index}`,
      product: {
        _type: "reference" as const,
        _ref: productId,
      },
      quantity: quantities[index],
      priceAtPurchase: lineItems.data[index]?.amount_total
        ? lineItems.data[index].amount_total / 100
        : 0,
    }));

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Extract shipping address
    const shippingAddress = session.customer_details?.address;
    const address = shippingAddress
      ? {
          name: session.customer_details?.name ?? "",
          line1: shippingAddress.line1 ?? "",
          line2: shippingAddress.line2 ?? "",
          city: shippingAddress.city ?? "",
          postcode: shippingAddress.postal_code ?? "",
          country: shippingAddress.country ?? "",
        }
      : undefined;

    // Create order in Sanity with customer reference
    console.log(`[Webhook] Creating order in Sanity with orderNumber: ${orderNumber}`);
    
    const order = await writeClient.create({
      _type: "order",
      orderNumber,
      ...(sanityCustomerId && {
        customer: {
          _type: "reference",
          _ref: sanityCustomerId,
        },
      }),
      clerkUserId,
      email: userEmail ?? session.customer_details?.email ?? "",
      items: orderItems,
      total: (session.amount_total ?? 0) / 100,
      status: "paid",
      stripePaymentId,
      address,
      createdAt: new Date().toISOString(),
    });

    console.log(`✅ [Webhook] Order created successfully: ${order._id} (${orderNumber})`);
    console.log(`   Clerk User ID: ${clerkUserId}`);
    console.log(`   Email: ${userEmail ?? session.customer_details?.email ?? ""}`);

    // Decrease stock for all products in a single transaction
    console.log(`[Webhook] Updating stock for ${productIds.length} products`);
    await productIds
      .reduce(
        (tx, productId, i) =>
          tx.patch(productId, (p) => p.dec({ stock: quantities[i] })),
        writeClient.transaction()
      )
      .commit();

    console.log(`✅ [Webhook] Stock updated successfully for ${productIds.length} products`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isAuthError =
      errorMessage.includes("Session not found") ||
      errorMessage.includes("Unauthorized") ||
      errorMessage.includes("SIO-401") ||
      errorMessage.includes("401");

    if (isAuthError) {
      console.error("❌ [Webhook] Sanity authentication failed:", errorMessage);
      console.error("   Please check your SANITY_API_WRITE_TOKEN environment variable.");
      console.error("   Make sure the token has Editor permissions in your Sanity project.");
      // Don't throw - return 200 to prevent infinite retries
      // The order will need to be created manually or via a retry after fixing the token
      return;
    }

    console.error("❌ [Webhook] Error handling checkout.session.completed:", error);
    console.error("   Error details:", {
      message: errorMessage,
      paymentId: stripePaymentId,
      clerkUserId: session.metadata?.clerkUserId,
    });
    throw error; // Re-throw to return 500 and trigger Stripe retry
  }
}
