"use client";
import { useState } from "react";
import type { Review } from "@/types";
import { RATING_CATEGORIES } from "@/types";
import { formatRelativeTime } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";
import styles from "./ReviewCard.module.css";

export default function ReviewCard({ review, currentUserId, onDelete }: { review: Review; currentUserId?: string; onDelete?: (id: string) => void }) {
  const [flagged, setFlagged] = useState(false);
  const isOwner = currentUserId === review.user_id;
  const displayName = review.profile?.full_name || "Anonymous";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleFlag = async () => {
    const reason = prompt("Why are you flagging this review?");
    if (!reason || reason.length < 5) return;
    const supabase = createClient();
    const { error } = await supabase.from("review_flags").insert({ review_id: review.id, user_id: currentUserId, reason });
    if (!error) setFlagged(true);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this review?")) return;
    const supabase = createClient();
    await supabase.from("reviews").delete().eq("id", review.id);
    onDelete?.(review.id);
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{initials}</div>
          <div>
            <div className={styles.userName}>{displayName}</div>
            <div className={styles.meta}>{formatRelativeTime(review.created_at)}{review.stay_duration && ` · ${review.stay_duration}`}</div>
          </div>
        </div>
        {isOwner && <button className={styles.actionBtn} onClick={handleDelete}>🗑️</button>}
      </div>
      <h4 className={styles.title}>{review.title}</h4>
      {review.rating && (
        <div className={styles.ratings}>
          {RATING_CATEGORIES.map((cat) => {
            const val = review.rating?.[cat.key as keyof typeof review.rating] as number;
            if (!val) return null;
            return <div key={cat.key} className={styles.ratingItem}><span>{cat.icon} {cat.label}</span><span style={{color:"var(--color-accent)"}}>{"★".repeat(val)}{"☆".repeat(5-val)}</span></div>;
          })}
        </div>
      )}
      <p className={styles.content}>{review.content}</p>
      {review.images && review.images.length > 0 && (
        <div className={styles.images}>{review.images.map((img) => <img key={img.id} src={img.image_url} alt="Review" className={styles.reviewImage} loading="lazy" />)}</div>
      )}
      <div className={styles.footer}>
        {review.rating && <span>★ <strong>{review.rating.overall}/5</strong> overall</span>}
        {currentUserId && !isOwner && <button className={styles.flagBtn} onClick={handleFlag} disabled={flagged}>{flagged ? "✓ Flagged" : "🚩 Flag"}</button>}
      </div>
    </div>
  );
}
