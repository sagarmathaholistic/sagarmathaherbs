import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Leaf, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { ensureAdminAccount } from "@/lib/admin-seed.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Sign In — Himalaya Naturals" },
      { name: "description", content: "Sign in to manage products, content and social settings." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Sign In — Himalaya Naturals" },
      { property: "og:description", content: "Staff sign-in for the Himalaya Naturals admin panel." },
    ],
  }),
  component: AuthPage,
});

const ADMIN_USERNAME = "Admin";
const ADMIN_EMAIL = "admin@himalayanaturals.com";

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState(ADMIN_USERNAME);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Everything below is best-effort: the sign-in page itself must render even
  // when the backend is not reachable.
  useEffect(() => {
    void ensureAdminAccount().catch(() => undefined);
    try {
      void supabase.auth
        .getSession()
        .then(({ data }) => {
          if (data.session) void navigate({ to: "/admin" });
        })
        .catch(() => undefined);
    } catch {
      /* backend not configured */
    }
  }, [navigate]);

  const resolveEmail = () => {
    const entered = username.trim();
    if (entered.includes("@")) return entered;
    return entered.toLowerCase() === ADMIN_USERNAME.toLowerCase() ? ADMIN_EMAIL : "";
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const email = resolveEmail();
    if (!email) {
      toast.error(mode === "signup" ? "Enter a valid email address" : "Unknown username");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      toast.success("Signed in");
      void navigate({ to: "/admin" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Sign in is unavailable right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Google sign in is unavailable right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leaf-gradient flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-lift">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Leaf className="size-4.5" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-semibold">Himalaya Naturals</span>
        </Link>

        <h1 className="mt-7 text-xl font-semibold">
          {mode === "signin" ? "Admin sign in" : "Create an account"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Use the username and password provided to you."
            : "Sign up with your email address and a password."}
        </p>

        <Button
          type="button"
          variant="outline"
          className="mt-6 w-full"
          disabled={loading}
          onClick={onGoogle}
        >
          Continue with Google
        </Button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">{mode === "signin" ? "Username or email" : "Email"}</Label>
            <Input
              id="username"
              type="text"
              autoComplete={mode === "signin" ? "username" : "email"}
              required
              maxLength={160}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              maxLength={200}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-5 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setUsername(mode === "signin" ? "" : ADMIN_USERNAME);
            setPassword("");
          }}
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
