"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import styles from "./HostelsFilter.module.css";

const SORT_PILLS = [
  { value: "rating",   label: "Top Rated" },
  { value: "",         label: "Most Reviewed" },
  { value: "distance", label: "Nearest" },
  { value: "price_low", label: "Price ↑" },
  { value: "price_high", label: "Price ↓" },
];

export default function HostelsFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);

  const activeSort = searchParams.get("sort") || "";

  const createQS = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => v ? params.set(k, v) : params.delete(k));
    return params.toString();
  }, [searchParams]);

  const setSort = (value: string) => {
    router.push(`${pathname}?${createQS({ sort: value })}`);
  };

  const hasFilters = searchParams.get("gender") || searchParams.get("sort");

  return (
    <div className={styles.wrapper}>
      {/* Sort pills */}
      <div className={styles.pillGroup}>
        {SORT_PILLS.map((pill) => (
          <button
            key={pill.value}
            className={`${styles.pill} ${activeSort === pill.value ? styles.pillActive : ""}`}
            onClick={() => setSort(pill.value)}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className={styles.filterRow}>
        <button
          className={styles.filterBtn}
          onClick={() => setFilterOpen(!filterOpen)}
          aria-expanded={filterOpen}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>tune</span>
          Filters
        </button>

        {/* Gender filter */}
        <div className={styles.filterChip}>
          <span className={styles.filterChipLabel}>Gender:</span>
          <select
            className={styles.filterSelect}
            value={searchParams.get("gender") || "all"}
            onChange={(e) => router.push(`${pathname}?${createQS({ gender: e.target.value })}`)}
          >
            <option value="all">All</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="co-ed">Co-Ed</option>
          </select>
        </div>

        {hasFilters && (
          <button className={styles.clearBtn} onClick={() => router.push(pathname)}>
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  );
}
