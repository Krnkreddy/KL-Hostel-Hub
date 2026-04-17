"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BottomNav.module.css";

const NAV_ITEMS = [
  { href: "/hostels", icon: "search", label: "Explore" },
  { href: "/profile#saved", icon: "bookmark", label: "Saved" },
  { href: "/hostels#reviews", icon: "rate_review", label: "Reviews" },
  { href: "/profile", icon: "person", label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Mobile navigation">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.label === "Explore"
            ? pathname.startsWith("/hostels")
            : item.label === "Profile"
            ? pathname === "/profile"
            : false;
        return (
          <Link key={item.href} href={item.href} className={`${styles.item} ${isActive ? styles.active : ""}`}>
            <span className={`material-symbols-outlined ${isActive ? "icon-fill" : ""} ${styles.icon}`}>
              {item.icon}
            </span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
