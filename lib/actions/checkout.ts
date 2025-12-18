"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { client } from "@/sanity/lib/client";
import { PRODUCTS_BY_IDS_QUERY } from "@/lib/sanity/queries/products";
import { getOrCreateStripeCustomer } from "@/lib/actions/customer";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
});

// Types
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CheckoutResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Creates a Stripe Checkout Session from cart items
 * Validates stock and prices against Sanity before creating session
 */
export async function createCheckoutSession(
  items: CartItem[]
): Promise<CheckoutResult> {
  try {
    // 1. Verify user is authenticated
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return { success: false, error: "Please sign in to checkout" };
    }

    // 2. Validate cart is not empty
    if (!items || items.length === 0) {
      return { success: false, error: "Your cart is empty" };
    }

    // 3. Fetch current product data from Sanity to validate prices/stock
    const productIds = items.map((item) => item.productId);
    const products = await client.fetch(PRODUCTS_BY_IDS_QUERY, {
      ids: productIds,
    });

    // 4. Validate each item
    const validationErrors: string[] = [];
    const validatedItems: {
      product: (typeof products)[number];
      quantity: number;
    }[] = [];

    for (const item of items) {
      const product = products.find(
        (p: { _id: string }) => p._id === item.productId
      );

      if (!product) {
        validationErrors.push(`Product "${item.name}" is no longer available`);
        continue;
      }

      if ((product.stock ?? 0) === 0) {
        validationErrors.push(`"${product.name}" is out of stock`);
        continue;
      }

      if (item.quantity > (product.stock ?? 0)) {
        validationErrors.push(
          `Only ${product.stock} of "${product.name}" available`
        );
        continue;
      }

      validatedItems.push({ product, quantity: item.quantity });
    }

    if (validationErrors.length > 0) {
      return { success: false, error: validationErrors.join(". ") };
    }

    // 5. Create Stripe line items with validated prices
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      validatedItems.map(({ product, quantity }) => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: product.name ?? "Product",
            images: product.image?.asset?.url ? [product.image.asset.url] : [],
            metadata: {
              productId: product._id,
            },
          },
          unit_amount: Math.round((product.price ?? 0) * 100), // Convert to cents
        },
        quantity,
      }));

    // 6. Get or create Stripe customer
    const userEmail = user.emailAddresses[0]?.emailAddress ?? "";
    const userName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || userEmail;

    const { stripeCustomerId, sanityCustomerId } =
      await getOrCreateStripeCustomer(userEmail, userName, userId);

    // 7. Prepare metadata for webhook
    const metadata = {
      clerkUserId: userId,
      userEmail,
      sanityCustomerId,
      productIds: validatedItems.map((i) => i.product._id).join(","),
      quantities: validatedItems.map((i) => i.quantity).join(","),
    };

    // 8. Create Stripe Checkout Session
    // Priority: NEXT_PUBLIC_BASE_URL > Vercel URL > localhost
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer: stripeCustomerId,
      shipping_address_collection: {
        allowed_countries: [
          "GB", // United Kingdom
          "US", // United States
          "CA", // Canada
          "AU", // Australia
          "NZ", // New Zealand
          "IE", // Ireland
          "DE", // Germany
          "FR", // France
          "ES", // Spain
          "IT", // Italy
          "NL", // Netherlands
          "BE", // Belgium
          "AT", // Austria
          "CH", // Switzerland
          "SE", // Sweden
          "NO", // Norway
          "DK", // Denmark
          "FI", // Finland
          "PT", // Portugal
          "PL", // Poland
          "CZ", // Czech Republic
          "GR", // Greece
          "HU", // Hungary
          "RO", // Romania
          "BG", // Bulgaria
          "HR", // Croatia
          "SI", // Slovenia
          "SK", // Slovakia
          "LT", // Lithuania
          "LV", // Latvia
          "EE", // Estonia
          "LU", // Luxembourg
          "MT", // Malta
          "CY", // Cyprus
          "JP", // Japan
          "SG", // Singapore
          "HK", // Hong Kong
          "KR", // South Korea
          "TW", // Taiwan
          "MY", // Malaysia
          "TH", // Thailand
          "IN", // India
          "AE", // United Arab Emirates
          "SA", // Saudi Arabia
          "IL", // Israel
          "ZA", // South Africa
          "BR", // Brazil
          "MX", // Mexico
          "AR", // Argentina
          "CL", // Chile
          "CO", // Colombia
        ],
      },
      metadata,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
    });

    return { success: true, url: session.url ?? undefined };
  } catch (error) {
    console.error("Checkout error:", error);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

/**
 * Creates an order from a Stripe checkout session (fallback if webhook fails)
 */
async function createOrderFromSession(session: Stripe.Checkout.Session) {
  const stripePaymentId = session.payment_intent as string;

  console.log(`[Fallback] Creating order from session: ${session.id}`);

  // Check if write token is available
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    console.error(
      "❌ [Fallback] SANITY_API_WRITE_TOKEN is not set. Cannot create order."
    );
    return { success: false, error: "Missing Sanity write token" };
  }

  try {
    const { writeClient } = await import("@/sanity/lib/client");
    const { ORDER_BY_STRIPE_PAYMENT_ID_QUERY } = await import(
      "@/lib/sanity/queries/orders"
    );

    // Idempotency check
    const existingOrder = await client.fetch(ORDER_BY_STRIPE_PAYMENT_ID_QUERY, {
      stripePaymentId,
    });

    if (existingOrder) {
      console.log(`[Fallback] Order already exists: ${existingOrder._id}`);
      return { success: true, orderId: existingOrder._id };
    }

    // Extract metadata
    const {
      clerkUserId,
      userEmail,
      sanityCustomerId,
      productIds: productIdsString,
      quantities: quantitiesString,
    } = session.metadata ?? {};

    if (!clerkUserId || !productIdsString || !quantitiesString) {
      console.error("[Fallback] Missing required metadata:", {
        clerkUserId: !!clerkUserId,
        productIds: !!productIdsString,
        quantities: !!quantitiesString,
      });
      return { success: false, error: "Missing session metadata" };
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

    // Create order in Sanity
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

    console.log(`✅ [Fallback] Order created: ${order._id} (${orderNumber})`);

    // Decrease stock
    await productIds
      .reduce(
        (tx, productId, i) =>
          tx.patch(productId, (p) => p.dec({ stock: quantities[i] })),
        writeClient.transaction()
      )
      .commit();

    console.log(`✅ [Fallback] Stock updated for ${productIds.length} products`);

    return { success: true, orderId: order._id };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ [Fallback] Error creating order:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Retrieves a checkout session by ID (for success page)
 * Also attempts to create order if webhook didn't process it
 */
export async function getCheckoutSession(sessionId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer_details"],
    });

    // Verify the session belongs to this user
    if (session.metadata?.clerkUserId !== userId) {
      return { success: false, error: "Session not found" };
    }

    // Check if order exists, if not, try to create it (fallback for webhook failures)
    if (session.payment_status === "paid") {
      const { ORDER_BY_STRIPE_PAYMENT_ID_QUERY } = await import(
        "@/lib/sanity/queries/orders"
      );
      const stripePaymentId = session.payment_intent as string;
      const existingOrder = await client.fetch(ORDER_BY_STRIPE_PAYMENT_ID_QUERY, {
        stripePaymentId,
      });

      if (!existingOrder) {
        console.log(
          `[Fallback] Order not found for payment ${stripePaymentId}, attempting to create...`
        );
        await createOrderFromSession(session);
      }
    }

    return {
      success: true,
      session: {
        id: session.id,
        customerEmail: session.customer_details?.email,
        customerName: session.customer_details?.name,
        amountTotal: session.amount_total,
        paymentStatus: session.payment_status,
        shippingAddress: session.customer_details?.address,
        lineItems: session.line_items?.data.map((item) => ({
          name: item.description,
          quantity: item.quantity,
          amount: item.amount_total,
        })),
      },
    };
  } catch (error) {
    console.error("Get session error:", error);
    return { success: false, error: "Could not retrieve order details" };
  }
}
