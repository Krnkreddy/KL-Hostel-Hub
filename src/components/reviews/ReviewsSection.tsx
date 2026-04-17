"use client";
import { useState, useMemo } from "react";
import ReviewCard from "@/components/reviews/ReviewCard";
import type { Review } from "@/types";
import styles from "./ReviewsSection.module.css";

type SortMode = "recent" | "helpful";

export default function ReviewsSection({
  reviews,
  totalReviews,
  currentUserId,
}: {
  reviews: Review[];
  totalReviews: number;
  currentUserId?: string;
}) {
  const [sort, setSort] = useState<SortMode>("recent");
  const [reviewList, setReviewList] = useState(reviews);

  const sorted = useMemo(() => {
    const copy = [...reviewList];
    if (sort === "helpful") {
      // Sort by highest overall rating first
      copy.sort((a, b) => (b.rating?.overall || 0) - (a.rating?.overall || 0));
    } else {
      // Most recent first
      copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return copy;
  }, [reviewList, sort]);

  const handleDelete = (id: string) => {
    setReviewList((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <section className={styles.section} id="reviews">
      <div className={styles.header}>
        <h2>Student Reviews {totalReviews > 0 && `(${totalReviews})`}</h2>
        <div className={styles.actions}>
          <button
            className={`${styles.pill} ${sort === "helpful" ? styles.pillActive : styles.pillInactive}`}
            onClick={() => setSort("helpful")}
          >
            Most Helpful
          </button>
          <button
            className={`${styles.pill} ${sort === "recent" ? styles.pillActive : styles.pillInactive}`}
            onClick={() => setSort("recent")}
          >
            Most Recent
          </button>
        </div>
      </div>

      {sorted.length > 0 ? (
        <>
          <div className={styles.list}>
            {sorted.map((r) => (
              <ReviewCard key={r.id} review={r} currentUserId={currentUserId} onDelete={handleDelete} />
            ))}
          </div>
          {totalReviews > 20 && (
            <div className={styles.viewAll}>
              <button>View all {totalReviews} reviews</button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.noReviews}>
          <span>📝</span>
          <h3>No reviews yet</h3>
          <p>Be the first to review this hostel!</p>
        </div>
      )}
    </section>
  );
}
