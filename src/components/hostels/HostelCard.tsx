import Link from "next/link";
import type { Hostel } from "@/types";
import { formatPrice, formatDistance } from "@/lib/utils/format";
import styles from "./HostelCard.module.css";
export default function HostelCard({ hostel, index = 0 }: { hostel: Hostel; index?: number }) {
  return (
    <Link href={`/hostels/${hostel.id}`} className={styles.card} style={{ animationDelay: `${index * 0.05}s` }}>
      <div className={styles.image}>🏠</div>
      <div className={styles.content}>
        <div className={styles.badges}>
          {hostel.is_verified && <span className="badge badge-success">✓ Verified</span>}
          <span className="badge badge-primary">{hostel.gender === "co-ed" ? "Co-Ed" : hostel.gender}</span>
        </div>
        <h3 className={styles.name}>{hostel.name}</h3>
        <p className={styles.address}>📍 {formatDistance(hostel.distance_from_campus)} from campus</p>
        <div className={styles.footer}>
          <span className={styles.price}>{formatPrice(hostel.price_min)}<span>/mo</span></span>
          {hostel.average_rating && (
            <span className={styles.rating}>★ {hostel.average_rating.toFixed(1)} <span>({hostel.review_count})</span></span>
          )}
        </div>
      </div>
    </Link>
  );
}
