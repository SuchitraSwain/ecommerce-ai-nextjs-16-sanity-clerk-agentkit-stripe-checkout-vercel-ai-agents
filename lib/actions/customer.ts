"use server";

import Stripe from "stripe";
import { client, writeClient } from "@/sanity/lib/client";
import { CUSTOMER_BY_EMAIL_QUERY } from "@/lib/sanity/queries/customers";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
});

/**
 * Gets or creates a Stripe customer by email
 * Also syncs the customer to Sanity database
 */
export async function getOrCreateStripeCustomer(
  email: string,
  name: string,
  clerkUserId: string
): Promise<{ stripeCustomerId: string; sanityCustomerId: string }> {
  // First, check if customer already exists in Sanity
  const existingCustomer = await client.fetch(CUSTOMER_BY_EMAIL_QUERY, {
    email,
  });

  if (existingCustomer?.stripeCustomerId) {
    // Customer exists, return existing IDs
    return {
      stripeCustomerId: existingCustomer.stripeCustomerId,
      sanityCustomerId: existingCustomer._id,
    };
  }

  // Check if customer exists in Stripe by email
  const existingStripeCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  let stripeCustomerId: string;

  if (existingStripeCustomers.data.length > 0) {
    // Customer exists in Stripe
    stripeCustomerId = existingStripeCustomers.data[0].id;
  } else {
    // Create new Stripe customer
    const newStripeCustomer = await stripe.customers.create({
      email,
      name,
      metadata: {
        clerkUserId,
      },
    });
    stripeCustomerId = newStripeCustomer.id;
  }

  // Create or update customer in Sanity
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    console.error(
      "SANITY_API_WRITE_TOKEN is not set. Cannot create/update customer in Sanity."
    );
    // Return Stripe customer ID only - Sanity sync will happen later via webhook
    return {
      stripeCustomerId,
      sanityCustomerId: "", // Will be created by webhook
    };
  }

  try {
    if (existingCustomer) {
      // Update existing Sanity customer with Stripe ID
      await writeClient
        .patch(existingCustomer._id)
        .set({ stripeCustomerId, clerkUserId, name })
        .commit();
      return {
        stripeCustomerId,
        sanityCustomerId: existingCustomer._id,
      };
    }

    // Create new customer in Sanity
    const newSanityCustomer = await writeClient.create({
      _type: "customer",
      email,
      name,
      clerkUserId,
      stripeCustomerId,
      createdAt: new Date().toISOString(),
    });

    return {
      stripeCustomerId,
      sanityCustomerId: newSanityCustomer._id,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isAuthError =
      errorMessage.includes("Session not found") ||
      errorMessage.includes("Unauthorized") ||
      errorMessage.includes("SIO-401");

    if (isAuthError) {
      console.error(
        "❌ Sanity authentication failed. Please check your SANITY_API_WRITE_TOKEN environment variable."
      );
      console.error(
        "   Make sure the token has Editor permissions in your Sanity project."
      );
    } else {
      console.error("Failed to create/update customer in Sanity:", error);
    }

    // If Sanity write fails, still return Stripe customer ID
    // The webhook can handle creating the Sanity customer later
    return {
      stripeCustomerId,
      sanityCustomerId: existingCustomer?._id || "",
    };
  }
}
