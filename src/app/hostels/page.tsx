import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import HostelCard from "@/components/hostels/HostelCard";
import HostelsFilter from "@/components/hostels/HostelsFilter";
import { sanitizeSearchInput } from "@/lib/utils/validation";
import type { Hostel } from "@/types";
import styles from "./page.module.css";

export const metadata = { title: "Browse Hostels", description: "Find and compare hostels near KL University." };

interface PageProps { searchParams: Promise<{ search?: string; gender?: string; sort?: string; minPrice?: string; maxPrice?: string }>; }

async function HostelsList({ searchParams }: { searchParams: Awaited<PageProps["searchParams"]> }) {
  const supabase = await createClient();
  let query = supabase.from("hostels").select("*");

  if (searchParams.search) {
    const safe = sanitizeSearchInput(searchParams.search);
    if (safe.length > 0) query = query.or(`name.ilike.%${safe}%,address.ilike.%${safe}%`);
  }
  if (searchParams.gender && searchParams.gender !== "all" && ["male","female","co-ed"].includes(searchParams.gender))
    query = query.eq("gender", searchParams.gender);
  if (searchParams.minPrice) { const m = parseInt(searchParams.minPrice); if (!isNaN(m) && m >= 0) query = query.gte("price_min", m); }
  if (searchParams.maxPrice) { const m = parseInt(searchParams.maxPrice); if (!isNaN(m) && m > 0) query = query.lte("price_max", m); }

  switch (searchParams.sort) {
    case "price_low": query = query.order("price_min", { ascending: true }); break;
    case "price_high": query = query.order("price_min", { ascending: false }); break;
    case "distance": query = query.order("distance_from_campus", { ascending: true }); break;
    case "newest": query = query.order("created_at", { ascending: false }); break;
    default: query = query.order("is_verified", { ascending: false }).order("created_at", { ascending: false });
  }

  const { data: hostels, error } = await query;
  if (error) return <div className={styles.emptyState}><p>Failed to load hostels. Please try again later.</p></div>;
  if (!hostels || hostels.length === 0) return <div className={styles.emptyState}><span className={styles.emptyIcon}>🔍</span><h3>No hostels found</h3><p>Try adjusting your filters</p></div>;

  // Batch ratings query (eliminates N+1)
  const hostelIds = hostels.map((h) => h.id);
  const { data: allRatings } = await supabase
    .from("ratings").select("overall, reviews!inner(hostel_id)").in("reviews.hostel_id", hostelIds);

  const ratingMap = new Map<string, { sum: number; count: number }>();
  if (allRatings) {
    for (const r of allRatings as any[]) {
      const hid = r.reviews?.hostel_id;
      if (!hid) continue;
      const e = ratingMap.get(hid) || { sum: 0, count: 0 };
      e.sum += r.overall; e.count += 1; ratingMap.set(hid, e);
    }
  }

  const hostelsWithRatings: Hostel[] = hostels.map((h) => {
    const rd = ratingMap.get(h.id);
    return { ...h, average_rating: rd ? Math.round((rd.sum / rd.count) * 10) / 10 : null, review_count: rd?.count || 0 };
  });

  if (searchParams.sort === "rating") hostelsWithRatings.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));

  return <div className={styles.grid}>{hostelsWithRatings.map((h, i) => <HostelCard key={h.id} hostel={h} index={i} />)}</div>;
}

export default async function HostelsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  return (
    <><Header /><main className="page-wrapper"><section className={styles.page}><div className="container">
      <div className={styles.pageHeader}><h1>Hostels Near Campus</h1><p>Discover verified hostels recommended by KL University students</p></div>
      <Suspense fallback={<div className="skeleton" style={{ height: 56, borderRadius: 16, marginBottom: 32 }} />}><HostelsFilter /></Suspense>
      <Suspense fallback={<HostelsLoadingSkeleton />}><HostelsList searchParams={resolvedParams} /></Suspense>
    </div></section></main><Footer /></>
  );
}

function HostelsLoadingSkeleton() {
  return <div className={styles.grid}>{Array.from({ length: 6 }).map((_, i) => <div key={i} className={styles.skeletonCard}><div className="skeleton" style={{ height: 200 }} /><div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}><div className="skeleton" style={{ height: 24, width: "70%" }} /><div className="skeleton" style={{ height: 16, width: "40%" }} /></div></div>)}</div>;
}
