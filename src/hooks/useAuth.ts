"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

// Create a stable singleton client outside the hook
const supabase = createClient();

export function useAuth() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Initial session check (once)
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (cancelled) return;
      if (authUser) {
        const { data } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
        if (!cancelled) { setUser(data); setAuthenticated(true); }
      }
      if (!cancelled) setLoading(false);
    });

    // Listen for auth changes (sign in / sign out only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_IN" && session?.user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (!cancelled) { setUser(data); setAuthenticated(true); setLoading(false); }
      } else if (event === "SIGNED_OUT") {
        if (!cancelled) { setUser(null); setAuthenticated(false); setLoading(false); }
      }
      // Ignore TOKEN_REFRESHED, INITIAL_SESSION etc. — they cause loops
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []); // empty deps — runs exactly once

  return { user, loading, authenticated, isAdmin: user?.role === "admin" };
}
