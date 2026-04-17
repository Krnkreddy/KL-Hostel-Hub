"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const redirectTo = searchParams.get("redirectTo") || "/hostels";

  const handleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: { scopes: "email profile", redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}` },
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.logo}>🏠</span>
        <h1 className={styles.title}>KL Hostel Hub</h1>
        <p className={styles.subtitle}>Sign in with your KL University Microsoft account</p>
        {error && <div className={styles.error}>⚠️ {message || "Authentication failed"}</div>}
        <button onClick={handleLogin} className={styles.msButton} id="sign-in-button">
          <svg width="20" height="20" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>
          Sign in with Microsoft
        </button>
        <p className={styles.notice}>🔒 Only <strong>@kluniversity.in</strong> accounts are allowed</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className={styles.page}><div className="skeleton" style={{width:400,height:400,borderRadius:24}} /></div>}><LoginContent /></Suspense>;
}
