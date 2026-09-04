import { createServerFn } from "@tanstack/react-start";

/** Ensures the default admin account exists. Safe to call repeatedly. */
export const ensureAdminAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { ensureAdminAccountOnce } = await import("./admin-seed.server");
  try {
    await ensureAdminAccountOnce();
    return { ok: true };
  } catch (error) {
    console.error("[admin-seed]", error);
    return { ok: false };
  }
});
