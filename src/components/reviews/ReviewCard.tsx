"use client";
import { useState } from "react";
import type { Review } from "@/types";
import { formatRelativeTime } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";
import styles from "./ReviewCard.module.css";

interface VoteCounts {
  helpful: number;
  not_helpful: number;
  userVote: "helpful" | "not_helpful" | null;
}

export default function ReviewCard({ review, currentUserId, onDelete, initialVotes }: {
  review: Review;
  currentUserId?: string;
  onDelete?: (id: string) => void;
  initialVotes?: VoteCounts;
}) {
  const [flagged, setFlagged] = useState(false);
  const [votes, setVotes] = useState<VoteCounts>(initialVotes || { helpful: 0, not_helpful: 0, userVote: null });
  const [voting, setVoting] = useState(false);

  const isOwner = currentUserId === review.user_id;
  const displayName = review.profile?.full_name || "Anonymous";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const ratingObj = review.rating || review.ratings?.[0];
  const overallRating = ratingObj?.overall;
  const isVerified = !!review.profile?.email?.endsWith("@kluniversity.in");

  const handleVote = async (type: "helpful" | "not_helpful") => {
    if (!currentUserId || isOwner || voting) return;
    setVoting(true);

    // Optimistic update
    setVotes((prev) => {
      const was = prev.userVote;
      if (was === type) {
        // Toggle off
        return { ...prev, [type]: prev[type] - 1, userVote: null };
      }
      const next = { ...prev, [type]: prev[type] + 1, userVote: type as "helpful" | "not_helpful" };
      if (was) next[was] = prev[was] - 1;
      return next;
    });

    try {
      await fetch(`/api/reviews/${review.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote_type: type }),
      });
    } catch {
      // Revert on failure
      setVotes(initialVotes || { helpful: 0, not_helpful: 0, userVote: null });
    }
    setVoting(false);
  };

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

        {/* Voting UI */}
        <div className={styles.voteRow}>
          <button
            className={`${styles.voteBtn} ${votes.userVote === "helpful" ? styles.voteBtnActive : ""}`}
            onClick={() => handleVote("helpful")}
            disabled={!currentUserId || isOwner}
            title={!currentUserId ? "Sign in to vote" : isOwner ? "Can't vote on your own review" : "Mark as helpful"}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>thumb_up</span>
            Helpful {votes.helpful > 0 && <span className={styles.voteCount}>({votes.helpful})</span>}
          </button>
          <button
            className={`${styles.voteBtn} ${votes.userVote === "not_helpful" ? styles.voteBtnActiveNeg : ""}`}
            onClick={() => handleVote("not_helpful")}
            disabled={!currentUserId || isOwner}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>thumb_down</span>
            Not Helpful {votes.not_helpful > 0 && <span className={styles.voteCount}>({votes.not_helpful})</span>}
          </button>
        </div>

        {/* Footer actions */}
        <div className={styles.footer}>
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
