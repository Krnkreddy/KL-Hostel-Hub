import Link from "next/link";
import type { Hostel } from "@/types";
import { formatPrice, formatDistance } from "@/lib/utils/format";
import styles from "./HostelCard.module.css";

function getRatingBand(rating: number | null | undefined) {
  if (!rating) return styles.bandNeutral;
  if (rating >= 4.0) return styles.bandGreen;
  if (rating >= 3.0) return styles.bandAmber;
  return styles.bandRed;
}

function getRatingColor(rating: number | null | undefined): string {
  if (!rating) return "var(--color-on-surface-variant)";
  if (rating >= 4.0) return "var(--color-secondary)";
  if (rating >= 3.0) return "var(--color-tertiary-fixed-dim)";
  return "var(--color-error)";
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className={styles.progressTrack}>
      <div className={styles.progressFill} style={{ width: `${(value / 5) * 100}%`, background: color }} />
    </div>
  );
}

const MINI_CATS = [
  { key: "average_cleanliness", label: "Cleanliness" },
  { key: "average_food_quality", label: "Food" },
  { key: "average_wifi_quality", label: "WiFi" },
  { key: "average_safety", label: "Safety" },
  { key: "average_value_for_money", label: "Value" },
  { key: "average_management", label: "Management" },
];

export default function HostelCard({ hostel, index = 0 }: { hostel: Hostel; index?: number }) {
  const ratingColor = getRatingColor(hostel.average_rating);

  return (
    <Link
      href={`/hostels/${hostel.id}`}
      className={`${styles.card} ${getRatingBand(hostel.average_rating)}`}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className={styles.body}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <h2 className={styles.name}>{hostel.name}</h2>
          <div className={styles.location}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
            <span>{hostel.address.split(",")[0]} · {formatDistance(hostel.distance_from_campus)} from campus</span>
          </div>
        </div>

        {/* Rating block */}
        {hostel.average_rating ? (
          <div className={styles.ratingBlock}>
            <span className={styles.ratingNum} style={{ color: ratingColor }}>
              {hostel.average_rating.toFixed(1)}
            </span>
            <div className={styles.stars} style={{ color: ratingColor }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`material-symbols-outlined ${s <= Math.round(hostel.average_rating!) ? "icon-fill" : ""}`} style={{ fontSize: 16 }}>
                  star
                </span>
              ))}
            </div>
            <span className={styles.reviewCount}>({hostel.review_count} review{hostel.review_count !== 1 ? "s" : ""})</span>
          </div>
        ) : (
          <p className={styles.noRating}>No reviews yet</p>
        )}

        {/* Mini progress bars — only show when reviews exist */}
        {hostel.average_rating != null && hostel.review_count && hostel.review_count > 0 && (
          <div className={styles.progressBars}>
            {MINI_CATS.map((cat) => {
              const val = (hostel as any)[cat.key] || 0;
              const color = val >= 4.0 ? "var(--color-secondary)" : val >= 3.0 ? "var(--color-tertiary-fixed-dim)" : "var(--color-error)";
              return (
                <div key={cat.key} className={styles.progressRow}>
                  <span className={styles.progressLabel}>{cat.label}</span>
                  <ProgressBar value={val} color={color} />
                  <span className={styles.progressScore}>{val > 0 ? val.toFixed(1) : "—"}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className={styles.cardFooter}>
          <div className={styles.tagRow}>
            {hostel.is_verified ? (
              <span className={styles.tag} style={{ background: "rgba(0,106,97,0.1)", color: "var(--color-secondary)" }}>
                ✓ Verified
              </span>
            ) : (
              <span className={styles.tag} style={{ background: "rgba(239,68,68,0.08)", color: "var(--color-error)" }}>
                ⚠ Unverified
              </span>
            )}
            <span className={styles.tag}>{hostel.gender === "co-ed" ? "Co-Ed" : hostel.gender.charAt(0).toUpperCase() + hostel.gender.slice(1)}</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span className={styles.price}>
              {formatPrice(hostel.price_min)}
              <span className={styles.priceSuffix}>{hostel.price_type === "yearly" ? "/yr" : "/mo"}</span>
            </span>
            {hostel.price_type === "yearly" && hostel.price_min > 0 && (
              <span className={styles.priceEquiv}>≈ {formatPrice(Math.round(hostel.price_min / 10))}/mo</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
