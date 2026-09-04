import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const ADMIN_USERNAME = "Admin";
export const ADMIN_EMAIL = "admin@himalayanaturals.com";
const ADMIN_PASSWORD = "Herbs@789";

let seeded: Promise<{ created: boolean }> | undefined;

async function findAdminUserId(): Promise<string | null> {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw new Error(error.message);
  const match = data.users.find(
    (user) => user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
  );
  return match?.id ?? null;
}

/** Idempotent: creates the default admin account + role only when missing. */
export async function seedAdminAccount(): Promise<{ created: boolean }> {
  let userId = await findAdminUserId();
  let created = false;

  if (!userId) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { username: ADMIN_USERNAME },
    });
    if (error) {
      // Race with a concurrent seed run: fall back to the existing user.
      userId = await findAdminUserId();
      if (!userId) throw new Error(error.message);
    } else {
      userId = data.user?.id ?? null;
      created = true;
    }
  }

  if (!userId) throw new Error("Unable to resolve the default admin user.");

  const { data: existingRole, error: roleReadError } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (roleReadError) throw new Error(roleReadError.message);

  if (!existingRole) {
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (roleError) throw new Error(roleError.message);
  }

  return { created };
}

/** Runs the seeder at most once per server instance. */
export function ensureAdminAccountOnce(): Promise<{ created: boolean }> {
  if (!seeded) {
    seeded = seedAdminAccount().catch((error) => {
      seeded = undefined;
      throw error;
    });
  }
  return seeded;
}
