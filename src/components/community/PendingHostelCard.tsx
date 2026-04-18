"use client";
import { useState } from "react";
import styles from "./PendingHostelCard.module.css";

interface PendingHostel {
  id: string; name: string; location: string; gender: string;
  price_min: number; price_max: number; description: string; distance: string;
  amenities: string[]; created_at: string;
  upvotes: number; downvotes: number; userVote: string | null;
}

export default function PendingHostelCard({ hostel, isLoggedIn, isOwner }: {
  hostel: PendingHostel; isLoggedIn: boolean; isOwner: boolean;
}) {
  const [upvotes, setUpvotes] = useState(hostel.upvotes);
  const [downvotes, setDownvotes] = useState(hostel.downvotes);
  const [userVote, setUserVote] = useState(hostel.userVote);
  const [voting, setVoting] = useState(false);

  const vote = async (type: "upvote" | "downvote") => {
    if (!isLoggedIn || isOwner || voting) return;
    setVoting(true);

    // Optimistic
    const was = userVote;
    if (was === type) {
      setUserVote(null);
      type === "upvote" ? setUpvotes((p) => p - 1) : setDownvotes((p) => p - 1);
    } else {
      setUserVote(type);
      type === "upvote" ? setUpvotes((p) => p + 1) : setDownvotes((p) => p + 1);
      if (was) was === "upvote" ? setUpvotes((p) => p - 1) : setDownvotes((p) => p - 1);
    }

    try {
      const res = await fetch("/api/hostels/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostel_id: hostel.id, vote_type: type }),
      });
      const data = await res.json();
      if (data.auto_approved) {
        alert(`🎉 "${hostel.name}" has been auto-approved by community votes!`);
      }
    } catch {
      // Revert
      setUpvotes(hostel.upvotes); setDownvotes(hostel.downvotes); setUserVote(hostel.userVote);
    }
    setVoting(false);
  };

  const ago = (() => {
    const d = (Date.now() - new Date(hostel.created_at).getTime()) / 1000;
    if (d < 3600) return `${Math.floor(d / 60)}m ago`;
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
    return `${Math.floor(d / 86400)}d ago`;
  })();

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <h3 className={styles.name}>{hostel.name}</h3>
        <span className={styles.badge}>Pending</span>
      </div>
      {hostel.location && <p className={styles.location}>📍 {hostel.location}</p>}
      {hostel.description && <p className={styles.desc}>{hostel.description}</p>}
      <div className={styles.meta}>
        {hostel.gender && <span className={styles.tag}>{hostel.gender}</span>}
        {hostel.distance && <span className={styles.tag}>📏 {hostel.distance}</span>}
        {hostel.price_min > 0 && <span className={styles.tag}>₹{hostel.price_min.toLocaleString()}/mo</span>}
      </div>
      {hostel.amenities.length > 0 && (
        <div className={styles.amenities}>
          {hostel.amenities.map((a) => <span key={a} className={styles.amenityChip}>{a}</span>)}
        </div>
      )}
      <div className={styles.footer}>
        <div className={styles.votes}>
          <button
            className={`${styles.voteBtn} ${userVote === "upvote" ? styles.upActive : ""}`}
            onClick={() => vote("upvote")}
            disabled={!isLoggedIn || isOwner}
            title={isOwner ? "Can't vote on own submission" : !isLoggedIn ? "Sign in to vote" : "Upvote"}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>thumb_up</span>
            {upvotes}
          </button>
          <button
            className={`${styles.voteBtn} ${userVote === "downvote" ? styles.downActive : ""}`}
            onClick={() => vote("downvote")}
            disabled={!isLoggedIn || isOwner}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>thumb_down</span>
            {downvotes}
          </button>
        </div>
        <span className={styles.time}>{ago}</span>
      </div>
      <div className={styles.progress}>
        <div className={styles.progressBar} style={{ width: `${Math.min(100, (upvotes / 5) * 100)}%` }} />
      </div>
      <p className={styles.progressLabel}>{upvotes}/5 votes needed for auto-approval</p>
    </div>
  );
}
