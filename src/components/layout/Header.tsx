"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NotificationBadge from "./NotificationBadge";
import styles from "./Header.module.css";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      window.location.href = `/hostels?search=${encodeURIComponent(searchValue.trim())}`;
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Brand */}
        <Link href="/" className={styles.brand}>
          <span className={styles.brandText}>KL Hostel Hub</span>
          <span className={styles.brandDot}></span>
        </Link>

        {/* Search bar — desktop */}
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <span className="material-symbols-outlined" style={{ color: "var(--color-outline)", fontSize: 20 }}>search</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search hostels near KL University..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            id="header-search"
          />
        </form>

        <nav className={styles.actions}>
          {user ? (
            <>
              <NotificationBadge />
              <div className={styles.userMenu} ref={menuRef}>
                <button
                  className={styles.avatar}
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="User menu"
                >
                  {initials}
                </button>
                {menuOpen && (
                  <div className={styles.dropdown}>
                    <Link href="/profile" className={styles.dropItem} onClick={() => setMenuOpen(false)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person</span>
                      Profile
                    </Link>
                    <Link href="/hostels" className={styles.dropItem} onClick={() => setMenuOpen(false)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
                      Explore
                    </Link>
                    <Link href="/community" className={styles.dropItem} onClick={() => setMenuOpen(false)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>groups</span>
                      Community
                    </Link>
                    <Link href="/submit-hostel" className={styles.dropItem} onClick={() => setMenuOpen(false)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
                      Suggest Hostel
                    </Link>
                    <div className={styles.dropDivider} />
                    <Link href="/auth/signout" className={`${styles.dropItem} ${styles.dropItemDanger}`} onClick={() => setMenuOpen(false)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                      Sign Out
                    </Link>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/login" className={styles.signInBtn}>
              Sign in with Microsoft
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
