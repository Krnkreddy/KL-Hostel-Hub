"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./BottomNav.module.css";

const NAV_ITEMS = [
  { href: "/hostels", icon: "search", label: "Explore" },
  { href: "/community", icon: "groups", label: "Community" },
  { href: "/submit-hostel", icon: "add_circle", label: "Suggest" },
  { href: "/profile", icon: "person", label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Mobile navigation">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/hostels"
            ? pathname.startsWith("/hostels")
            : pathname === item.href;
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
