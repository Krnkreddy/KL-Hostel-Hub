"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./Header.module.css";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo}>🏠 KL <span>Hostel Hub</span></Link>
        <nav className={styles.nav}>
          <Link href="/hostels" className={styles.navLink}>Hostels</Link>
          {user ? (
            <div className={styles.userMenu}>
              <button className={styles.avatar} onClick={() => setMenuOpen(!menuOpen)}>{initials}</button>
              {menuOpen && (
                <div className={styles.dropdown}>
                  <Link href="/profile" className={styles.dropItem}>Profile</Link>
                  <Link href="/auth/signout" className={styles.dropItem}>Sign Out</Link>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">Sign In</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
