"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import styles from "./HostelsFilter.module.css";
export default function HostelsFilter() {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const createQS = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => v ? params.set(k, v) : params.delete(k));
    return params.toString();
  }, [searchParams]);
  return (
    <div className={styles.filterBar}>
      <form className={styles.searchForm} onSubmit={(e) => { e.preventDefault(); router.push(`${pathname}?${createQS({ search })}`); }}>
        <span className={styles.searchIcon}>🔍</span>
        <input type="text" placeholder="Search hostels..." value={search} onChange={(e) => setSearch(e.target.value)} className={styles.searchInput} id="hostel-search-input" />
        <button type="submit" className="btn btn-primary btn-sm">Search</button>
      </form>
      <div className={styles.filters}>
        <select className={styles.select} value={searchParams.get("gender") || "all"} onChange={(e) => router.push(`${pathname}?${createQS({ gender: e.target.value })}`)}>
          <option value="all">All Genders</option><option value="male">Male</option><option value="female">Female</option><option value="co-ed">Co-Ed</option>
        </select>
        <select className={styles.select} value={searchParams.get("sort") || ""} onChange={(e) => router.push(`${pathname}?${createQS({ sort: e.target.value })}`)}>
          <option value="">Sort: Default</option><option value="rating">Highest Rated</option><option value="price_low">Price: Low→High</option><option value="price_high">Price: High→Low</option><option value="distance">Nearest</option>
        </select>
        {(searchParams.get("search") || searchParams.get("gender") || searchParams.get("sort")) && (
          <button className="btn btn-ghost btn-sm" onClick={() => router.push(pathname)}>✕ Clear</button>
        )}
      </div>
    </div>
  );
}
