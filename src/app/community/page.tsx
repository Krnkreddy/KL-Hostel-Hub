import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import { createClient } from "@/lib/supabase/server";
import PendingHostelCard from "@/components/community/PendingHostelCard";
import styles from "./page.module.css";

export const metadata = { title: "Community — Pending Hostels" };

export default async function CommunityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: pendingHostels } = await supabase
    .from("pending_hostels")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Get vote counts for each pending hostel
  const hostelsWithVotes = await Promise.all(
    (pendingHostels || []).map(async (h) => {
      const { data: votes } = await supabase.from("hostel_votes").select("user_id, vote_type").eq("hostel_id", h.id);
      const upvotes = votes?.filter((v) => v.vote_type === "upvote").length || 0;
      const downvotes = votes?.filter((v) => v.vote_type === "downvote").length || 0;
      const userVote = votes?.find((v) => v.user_id === user?.id)?.vote_type || null;
      return { ...h, upvotes, downvotes, userVote };
    })
  );

  return (
    <><Header /><main className="page-wrapper"><section className={styles.page}><div className="container">
      <div className={styles.header}>
        <div>
          <h1>Community Hostels</h1>
          <p>Hostels submitted by students — vote to help get them listed!</p>
        </div>
        <Link href="/submit-hostel" className="btn btn-secondary">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Suggest Hostel
        </Link>
      </div>

      {hostelsWithVotes.length > 0 ? (
        <div className={styles.grid}>
          {hostelsWithVotes.map((h) => (
            <PendingHostelCard
              key={h.id}
              hostel={h}
              isLoggedIn={!!user}
              isOwner={user?.id === h.submitted_by}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <span>🏗️</span>
          <h3>No pending hostels</h3>
          <p>Be the first to suggest a hostel!</p>
          <Link href="/submit-hostel" className="btn btn-primary" style={{ marginTop: 16 }}>Suggest a Hostel</Link>
        </div>
      )}
    </div></section></main><Footer /><BottomNav /></>
  );
}
