/**
 * This configuration file lets you run `$ sanity [command]` in this folder
 * Go to https://www.sanity.io/docs/cli to learn more.
 **/
import { defineCliConfig } from "sanity/cli";

import { loadEnvConfig } from "@next/env";
import dotenv from "dotenv";
import path from "path";

// Try to load .env.local first, then fallback to .env
const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Also try Next.js env loading
try {
  loadEnvConfig(process.cwd());
} catch (e) {
  // Ignore if Next.js env loading fails
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const organizationId = process.env.NEXT_PUBLIC_SANITY_ORG_ID;

if (!projectId) {
  throw new Error(
    "NEXT_PUBLIC_SANITY_PROJECT_ID is not set. Please create a .env.local file with your Sanity project ID."
  );
}

export default defineCliConfig({
  ...(organizationId && {
    app: {
      organizationId,
      entry: "./app/(admin)/admin/page.tsx",
    },
  }),
  api: { projectId, dataset },
});
