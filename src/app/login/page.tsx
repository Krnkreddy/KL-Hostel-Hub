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
      options: {
        scopes: "email profile",
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
  };

  return (
    <div className={styles.page}>
      {/* Decorative background blobs */}
      <div className={styles.blobTop} />
      <div className={styles.blobBottom} />

      <main className={styles.main}>
        {/* Brand header */}
        <div className={styles.brandHeader}>
          <div className={styles.brandRow}>
            <span className={`material-symbols-outlined icon-fill ${styles.brandIcon}`}>apartment</span>
            <span className={styles.brandName}>KL Hostel Hub</span>
          </div>
          <p className={styles.brandSub}>Honest hostel reviews by real KL students</p>
        </div>

        {/* Card */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h1 className={styles.title}>Welcome to KL Hostel Hub</h1>
            <p className={styles.subtitle}>
              Sign in with your KL University Microsoft account to securely access trusted student housing reviews and insights.
            </p>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>error</span>
              {message || "Authentication failed. Please try again."}
            </div>
          )}

          <button onClick={handleLogin} className={styles.msBtn} id="sign-in-button">
            <svg width="22" height="22" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 0H0v10h10V0z" fill="#f25022" />
              <path d="M21 0H11v10h10V0z" fill="#7fba00" />
              <path d="M10 11H0v10h10V11z" fill="#00a4ef" />
              <path d="M21 11H11v10h10V11z" fill="#ffb900" />
            </svg>
            <span>Sign in with Microsoft</span>
          </button>

          {/* Divider */}
          <div className={styles.divider}>
            <div className={styles.dividerBar} />
          </div>

          {/* Domain notice */}
          <div className={styles.notice}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--color-outline)", flexShrink: 0 }}>lock</span>
            <p>
              Only <strong>@kluniversity.in</strong> email addresses are allowed to maintain the integrity and privacy of the student community network.
            </p>
          </div>
        </div>

        {/* Footer links */}
        <footer className={styles.footerLinks}>
          <a href="#">Terms of Service</a>
          <span className={styles.dot} />
          <a href="#">Privacy Policy</a>
          <span className={styles.dot} />
          <a href="#">Report Issue</a>
        </footer>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-surface)" }}>
        <div className="skeleton" style={{ width: 440, height: 480, borderRadius: 16 }} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
