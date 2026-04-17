import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ReviewCard from "@/components/reviews/ReviewCard";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatDistance } from "@/lib/utils/format";
import type { AggregateRating } from "@/types";
import styles from "./page.module.css";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: hostel } = await supabase.from("hostels").select("name, description").eq("id", id).single();
  if (!hostel) return { title: "Hostel Not Found" };
  return { title: hostel.name, description: hostel.description.slice(0, 160) };
}

export default async function HostelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: hostel, error } = await supabase.from("hostels").select("*").eq("id", id).single();
  if (error || !hostel) return notFound();

  const { data: ratingsData } = await supabase.rpc("get_hostel_ratings", { hostel_uuid: id });
  const ratings: AggregateRating | null = ratingsData?.[0] || null;

  // ✅ BUG-04 FIX: Limit reviews to 20 per page to prevent unbounded loads
  const { data: reviews } = await supabase.from("reviews").select("*, profile:profiles(*), rating:ratings(*), images:review_images(*)").eq("hostel_id", id).order("created_at", { ascending: false }).limit(20);
  const { data: { user } } = await supabase.auth.getUser();

  let hasReviewed = false;
  if (user) {
    const { data: existing } = await supabase.from("reviews").select("id").eq("hostel_id", id).eq("user_id", user.id).single();
    hasReviewed = !!existing;
  }

  const ratingCats = [
    { key: "average_cleanliness", label: "Cleanliness", icon: "🧹" },
    { key: "average_food_quality", label: "Food Quality", icon: "🍽️" },
    { key: "average_wifi_quality", label: "WiFi", icon: "📶" },
    { key: "average_safety", label: "Safety", icon: "🔒" },
    { key: "average_value_for_money", label: "Value", icon: "💰" },
    { key: "average_management", label: "Management", icon: "👥" },
  ];

  return (
    <><Header /><main className="page-wrapper"><section className={styles.page}><div className="container">
      <nav className={styles.breadcrumb}><Link href="/hostels">← Back to Hostels</Link></nav>
      <div className={styles.hero}><div className={styles.heroImage}>🏠</div><div className={styles.heroOverlay}><div className={styles.heroBadges}>{hostel.is_verified && <span className="badge badge-success">✓ Verified</span>}<span className="badge badge-primary">{hostel.gender === "co-ed" ? "Co-Ed" : hostel.gender}</span></div></div></div>
      <div className={styles.layout}>
        <div className={styles.main}>
          <h1 className={styles.title}>{hostel.name}</h1>
          <div className={styles.metaRow}><span>📍 {hostel.address}</span><span>📏 {formatDistance(hostel.distance_from_campus)} from campus</span></div>

          {ratings && ratings.total_reviews > 0 && (
            <div className={styles.ratingBox}>
              <div className={styles.overallRating}>
                <span className={styles.ratingBig}>{Number(ratings.average_overall).toFixed(1)}</span>
                <div><div className={styles.ratingStars}>{"★".repeat(Math.round(Number(ratings.average_overall)))}{"☆".repeat(5 - Math.round(Number(ratings.average_overall)))}</div><span className={styles.ratingCount}>{ratings.total_reviews} review{Number(ratings.total_reviews) !== 1 ? "s" : ""}</span></div>
              </div>
              <div className={styles.ratingBreakdown}>
                {ratingCats.map((cat) => { const val = Number(ratings[cat.key as keyof AggregateRating] || 0); return (
                  <div key={cat.key} className={styles.ratingBar}><span className={styles.ratingBarLabel}>{cat.icon} {cat.label}</span><div className={styles.ratingBarTrack}><div className={styles.ratingBarFill} style={{ width: `${(val / 5) * 100}%` }} /></div><span className={styles.ratingBarValue}>{val.toFixed(1)}</span></div>
                ); })}
              </div>
            </div>
          )}

          <div className={styles.descSection}><h2>About This Hostel</h2><p>{hostel.description}</p></div>
          <div className={styles.descSection}><h2>Amenities</h2><div className={styles.amenitiesGrid}>{hostel.amenities.map((a: string) => <span key={a} className={styles.amenityChip}>{a}</span>)}</div></div>

          <div className={styles.reviewsSection}>
            <div className={styles.reviewsHeader}>
              <h2>Student Reviews</h2>
              {user && !hasReviewed && <Link href={`/hostels/${id}/review`} className="btn btn-primary" id="write-review-button">✍️ Write a Review</Link>}
              {!user && <Link href={`/login?redirectTo=/hostels/${id}/review`} className="btn btn-primary">Sign In to Review</Link>}
              {hasReviewed && <span className="badge badge-neutral">✓ You&apos;ve reviewed this hostel</span>}
            </div>
            {reviews && reviews.length > 0 ? <div className={styles.reviewsList}>{reviews.map((r) => <ReviewCard key={r.id} review={r} currentUserId={user?.id} />)}</div>
              : <div className={styles.noReviews}><span>📝</span><h3>No reviews yet</h3><p>Be the first to review this hostel!</p></div>}
          </div>
        </div>
        <aside className={styles.sidebar}>
          <div className={styles.priceCard}><h3>Monthly Rent</h3><div className={styles.priceRange}><span>{formatPrice(hostel.price_min)}</span><span className={styles.priceSep}>–</span><span>{formatPrice(hostel.price_max)}</span></div><span className={styles.priceNote}>per month</span></div>
          {hostel.contact_phone && <div className={styles.contactCard}><h3>Contact</h3><a href={`tel:${hostel.contact_phone}`} className={styles.contactLink}>📞 {hostel.contact_phone}</a>{hostel.contact_email && <a href={`mailto:${hostel.contact_email}`} className={styles.contactLink}>✉️ {hostel.contact_email}</a>}</div>}
          <div className={styles.infoCard}><h3>Quick Info</h3>
            <div className={styles.infoItem}><span>Gender</span><span>{hostel.gender === "co-ed" ? "Co-Ed" : hostel.gender}</span></div>
            <div className={styles.infoItem}><span>Distance</span><span>{formatDistance(hostel.distance_from_campus)}</span></div>
            <div className={styles.infoItem}><span>Amenities</span><span>{hostel.amenities.length} available</span></div>
            <div className={styles.infoItem}><span>Status</span><span>{hostel.is_verified ? "✓ Verified" : "Unverified"}</span></div>
          </div>
        </aside>
      </div>
    </div></section></main><Footer /></>
  );
}
