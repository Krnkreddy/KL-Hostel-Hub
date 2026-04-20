import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import ReviewsSection from "@/components/reviews/ReviewsSection";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatDistance } from "@/lib/utils/format";
import type { AggregateRating } from "@/types";
import styles from "./page.module.css";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: hostel } = await supabase.from("hostels").select("name, description").eq("id", id).single();
  if (!hostel) return { title: "Hostel Not Found" };
  return { title: hostel.name, description: (hostel.description || "").slice(0, 160) || `Reviews for ${hostel.name}` };
}

const CAT_ICONS: Record<string, string> = {
  average_food_quality:   "restaurant",
  average_cleanliness:    "cleaning_services",
  average_wifi_quality:   "wifi",
  average_safety:         "security",
  average_value_for_money:"savings",
  average_management:     "support_agent",
};
const CAT_LABELS: Record<string, string> = {
  average_food_quality:   "Food Quality",
  average_cleanliness:    "Cleanliness",
  average_wifi_quality:   "WiFi",
  average_safety:         "Safety",
  average_value_for_money:"Value",
  average_management:     "Management",
};

function scoreColor(val: number): string {
  if (val >= 4.0) return "#10B981";
  if (val >= 3.0) return "#F59E0B";
  return "#EF4444";
}

export default async function HostelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: hostel, error } = await supabase.from("hostels").select("*").eq("id", id).single();
  if (error || !hostel) return notFound();

  const { data: ratingsData } = await supabase.rpc("get_hostel_ratings", { hostel_uuid: id });
  const ratings: AggregateRating | null = ratingsData?.[0] || null;

  // Fetch reviews (plain — no risky FK hints that can silently filter results)
  const { data: rawReviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("hostel_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Batch-fetch related data for each review
  const reviews = rawReviews || [];
  const userIds = [...new Set(reviews.map((r) => r.user_id))];
  const reviewIds = reviews.map((r) => r.id);

  const [profilesRes, ratingsRes, imagesRes] = await Promise.all([
    userIds.length > 0
      ? supabase.from("profiles").select("*").in("id", userIds)
      : { data: [] },
    reviewIds.length > 0
      ? supabase.from("ratings").select("*").in("review_id", reviewIds)
      : { data: [] },
    reviewIds.length > 0
      ? supabase.from("review_images").select("*").in("review_id", reviewIds)
      : { data: [] },
  ]);

  const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
  const ratingsMap = new Map((ratingsRes.data || []).map((r: any) => [r.review_id, r]));
  const imagesMap = new Map<string, any[]>();
  for (const img of (imagesRes.data || [])) {
    if (!imagesMap.has(img.review_id)) imagesMap.set(img.review_id, []);
    imagesMap.get(img.review_id)!.push(img);
  }

  const enrichedReviews = reviews.map((r) => ({
    ...r,
    profile: profileMap.get(r.user_id) || null,
    rating: ratingsMap.get(r.id) || null,
    images: imagesMap.get(r.id) || [],
  }));

  const { data: { user } } = await supabase.auth.getUser();

  let hasReviewed = false;
  if (user) {
    const { data: existing } = await supabase.from("reviews").select("id").eq("hostel_id", id).eq("user_id", user.id).single();
    hasReviewed = !!existing;
  }

  const overall = ratings ? Number(ratings.average_overall) : null;
  const totalReviews = ratings ? Number(ratings.total_reviews) : 0;

  // Compute real star distribution from review data
  const starDist = (() => {
    if (enrichedReviews.length === 0) return [];
    const counts = [0, 0, 0, 0, 0];
    for (const r of enrichedReviews) {
      const o = r.rating?.overall;
      if (o && o >= 1 && o <= 5) counts[o - 1]++;
    }
    const total = counts.reduce((a, b) => a + b, 0);
    return [5, 4, 3, 2, 1].map((star) => ({
      label: `${star} star`,
      pct: total > 0 ? Math.round((counts[star - 1] / total) * 100) : 0,
    }));
  })();

  const catKeys = Object.keys(CAT_ICONS);

  return (
    <>
      <Header />
      <main className="page-wrapper">
        <section className={styles.page}>
          <div className="container">
            <nav className={styles.breadcrumb}>
              <Link href="/hostels">← Back to Hostels</Link>
            </nav>

            <div className={styles.layout}>
              {/* Main content */}
              <div>
                {/* Hostel header */}
                <header className={styles.hostelHeader}>
                  <h1 className={styles.hostelTitle}>{hostel.name}</h1>
                  <div className={styles.metaTags}>
                    <span className={styles.metaTag}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>location_on</span>
                      {hostel.address}
                    </span>
                    <span className={styles.metaTag}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>directions_walk</span>
                      {formatDistance(hostel.distance_from_campus)} from campus
                    </span>
                  </div>
                </header>

                {/* Rating banner */}
                {overall != null && overall > 0 && totalReviews > 0 && (
                  <div className={styles.ratingBanner}>
                    <div className={styles.bannerLeft}>
                      <span className={styles.bannerScore}>{overall.toFixed(1)}</span>
                      <div className={styles.bannerStars}>
                        {[1,2,3,4,5].map((s) => (
                          <span key={s} className={`material-symbols-outlined ${s <= Math.round(overall) ? "icon-fill" : ""}`} style={{ fontSize: 22 }}>star</span>
                        ))}
                      </div>
                      <p className={styles.bannerReviewCount}>Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}</p>
                    </div>
                    <div className={styles.bannerDivider} />
                    <div className={styles.bannerBars}>
                      {starDist.map((s) => (
                        <div key={s.label} className={styles.bannerBar}>
                          <span className={styles.bannerBarLabel}>{s.label}</span>
                          <div className={styles.bannerBarTrack}>
                            <div className={styles.bannerBarFill} style={{ width: `${s.pct}%` }} />
                          </div>
                          <span className={styles.bannerBarPct}>{s.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category breakdown */}
                {ratings && totalReviews > 0 && (
                  <section className={styles.catSection}>
                    <h2>Category Breakdown</h2>
                    <div className={styles.catGrid}>
                      {catKeys.map((key) => {
                        const val = Number(ratings[key as keyof AggregateRating] || 0);
                        const color = scoreColor(val);
                        return (
                          <div key={key} className={styles.catItem}>
                            <div className={styles.catItemLeft}>
                              <div className={styles.catIconWrap}>
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{CAT_ICONS[key]}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div className={styles.catDot} style={{ background: color }} />
                                <span className={styles.catLabel}>{CAT_LABELS[key]}</span>
                              </div>
                            </div>
                            <span className={styles.catScore} style={{ color }}>{val.toFixed(1)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                <ReviewsSection
                  reviews={enrichedReviews}
                  totalReviews={totalReviews}
                  currentUserId={user?.id}
                />

                {/* Write review CTA */}
                <section className={styles.writeSection}>
                  <h2>Leave a Review</h2>
                  <div className={styles.writeCard}>
                    <div className={styles.writeCardText}>
                      <strong>Share your experience</strong>
                      <p>Help other students make the right choice</p>
                    </div>
                    {user && !hasReviewed && (
                      <Link href={`/hostels/${id}/review`} className="btn btn-secondary" id="write-review-button">
                        Write a Review
                      </Link>
                    )}
                    {!user && (
                      <Link href={`/login?redirectTo=/hostels/${id}/review`} className="btn btn-primary">
                        Sign In to Review
                      </Link>
                    )}
                    {hasReviewed && <span className="badge badge-success">✓ You&apos;ve reviewed this hostel</span>}
                  </div>
                </section>
              </div>

              {/* Sidebar */}
              <aside className={styles.sidebar}>
                <div className={styles.sideCard}>
                  <h3>{hostel.price_type === "yearly" ? "Annual Fee" : "Monthly Rent"}</h3>
                  <div className={styles.priceRange}>
                    <span>{formatPrice(hostel.price_min)}</span>
                    <span className={styles.priceSep}>—</span>
                    <span>{formatPrice(hostel.price_max)}</span>
                  </div>
                  <p className={styles.priceNote}>
                    {hostel.price_type === "yearly" ? "per academic year" : "per month"}
                  </p>
                  {hostel.price_type === "yearly" && hostel.price_min > 0 && (
                    <p className={styles.priceNote} style={{ color: "var(--color-secondary)" }}>
                      ≈ {formatPrice(Math.round(hostel.price_min / 10))} – {formatPrice(Math.round(hostel.price_max / 10))}/mo
                    </p>
                  )}
                </div>

                <div className={styles.sideCard}>
                  <h3>Quick Info</h3>
                  <div className={styles.infoItem}><span>Gender</span><span>{hostel.gender === "co-ed" ? "Co-Ed" : hostel.gender.charAt(0).toUpperCase() + hostel.gender.slice(1)}</span></div>
                  <div className={styles.infoItem}><span>Distance</span><span>{formatDistance(hostel.distance_from_campus)}</span></div>
                  <div className={styles.infoItem}><span>Amenities</span><span>{hostel.amenities.length} available</span></div>
                  <div className={styles.infoItem}><span>Status</span><span>{hostel.is_verified ? "✓ Verified" : "Unverified"}</span></div>
                </div>

                {hostel.amenities.length > 0 && (
                  <div className={styles.sideCard}>
                    <h3>Amenities</h3>
                    <div className={styles.amenityGrid}>
                      {hostel.amenities.map((a: string) => (
                        <span key={a} className={styles.amenityChip}>{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {hostel.contact_phone && (
                  <div className={styles.sideCard}>
                    <h3>Contact</h3>
                    <a href={`tel:${hostel.contact_phone}`} className={styles.contactLink}>📞 {hostel.contact_phone}</a>
                    {hostel.contact_email && <a href={`mailto:${hostel.contact_email}`} className={styles.contactLink}>✉️ {hostel.contact_email}</a>}
                  </div>
                )}
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
