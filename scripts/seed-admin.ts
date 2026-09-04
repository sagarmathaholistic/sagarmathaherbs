/**
 * Build/deploy-time seeder for the default admin account.
 * Run with: bun run seed:admin
 * No-ops (without failing the build) when service credentials are unavailable.
 */
import { seedAdminAccount } from "../src/lib/admin-seed.server";

async function main() {
  if (!process.env["SUPABASE_URL"] || !process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
    console.warn("[seed:admin] Skipped — backend service credentials are not available here.");
    return;
  }
  try {
    const { created } = await seedAdminAccount();
    console.log(created ? "[seed:admin] Admin account created." : "[seed:admin] Admin already exists.");
  } catch (error) {
    console.warn("[seed:admin] Skipped:", error instanceof Error ? error.message : error);
  }
}

void main();
