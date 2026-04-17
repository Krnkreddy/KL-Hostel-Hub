"use client";
import { useState } from "react";
import type { Review } from "@/types";
import { formatRelativeTime } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";
import styles from "./ReviewCard.module.css";

export default function ReviewCard({ review, currentUserId, onDelete }: {
  review: Review;
  currentUserId?: string;
  onDelete?: (id: string) => void;
}) {
  const [flagged, setFlagged] = useState(false);
  const isOwner = currentUserId === review.user_id;
  const displayName = review.profile?.full_name || "Anonymous";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const overallRating = review.rating?.overall;
  const isVerified = !!review.profile?.email?.endsWith("@kluniversity.in");

  const handleFlag = async () => {
    const reason = prompt("Why are you flagging this review?");
    if (!reason || reason.length < 5) return;
    const supabase = createClient();
    const { error } = await supabase.from("review_flags").insert({ review_id: review.id, user_id: currentUserId, reason });
    if (!error) setFlagged(true);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this review?")) return;
    const res = await fetch(`/api/reviews/${review.id}`, { method: "DELETE" });
    if (res.ok) onDelete?.(review.id);
  };

  return (
    <article className={styles.card}>
      {/* Left accent border */}
      <div className={styles.accentBar} style={{ background: overallRating && overallRating >= 4 ? "var(--color-secondary)" : "var(--color-surface-container-highest)" }} />

      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.userRow}>
            <div className={styles.avatar}>{initials}</div>
            <div>
              <h3 className={styles.userName}>{displayName}</h3>
              <div className={styles.userMeta}>
                {isVerified && (
                  <span className={styles.verifiedBadge}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified</span>
                    Verified KL Student
                  </span>
                )}
                <span className={styles.dateText}>{formatRelativeTime(review.created_at)}</span>
                {review.stay_duration && <span className={styles.dateText}>· {review.stay_duration}</span>}
              </div>
            </div>
          </div>

          {/* Stars */}
          {overallRating && (
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`material-symbols-outlined ${s <= overallRating ? "icon-fill" : ""}`}
                  style={{ fontSize: 16, color: "var(--color-tertiary-fixed-dim)" }}>
                  star
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Review title */}
        <h4 className={styles.title}>{review.title}</h4>

        {/* Content */}
        <p className={styles.content}>{review.content}</p>

        {/* Images */}
        {review.images && review.images.length > 0 && (
          <div className={styles.images}>
            {review.images.map((img) => (
              <img key={img.id} src={img.image_url} alt="Review" className={styles.reviewImage} loading="lazy" />
            ))}
          </div>
        )}

        {/* Footer actions */}
        <div className={styles.footer}>
          {currentUserId && !isOwner && (
            <button className={styles.helpfulBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>thumb_up</span>
              Helpful
            </button>
          )}
          <div className={styles.footerRight}>
            {isOwner && (
              <button className={styles.deleteBtn} onClick={handleDelete}>Delete</button>
            )}
            {currentUserId && !isOwner && (
              <button className={styles.reportBtn} onClick={handleFlag} disabled={flagged}>
                {flagged ? "✓ Flagged" : "Report"}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
