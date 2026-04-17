"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./Header.module.css";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  // ✅ BUG-07 FIX: Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

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
            <div className={styles.userMenu} ref={menuRef}>
              <button className={styles.avatar} onClick={() => setMenuOpen(!menuOpen)}>{initials}</button>
              {menuOpen && (
                <div className={styles.dropdown}>
                  <Link href="/profile" className={styles.dropItem} onClick={() => setMenuOpen(false)}>Profile</Link>
                  <Link href="/auth/signout" className={styles.dropItem} onClick={() => setMenuOpen(false)}>Sign Out</Link>
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
