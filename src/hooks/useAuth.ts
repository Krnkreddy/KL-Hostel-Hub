"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
export function useAuth() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    return data;
  }, []);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (authUser) { setUser(await fetchProfile(authUser.id)); setAuthenticated(true); }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) { setUser(await fetchProfile(session.user.id)); setAuthenticated(true); }
      else if (event === "SIGNED_OUT") { setUser(null); setAuthenticated(false); }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);
  return { user, loading, authenticated, isAdmin: user?.role === "admin" };
}
