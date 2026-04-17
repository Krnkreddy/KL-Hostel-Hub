import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils/format";
import styles from "./page.module.css";

export const metadata = { title: "Admin Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/hostels");

  const { count: hostelCount } = await supabase.from("hostels").select("*", { count: "exact", head: true });
  const { count: reviewCount } = await supabase.from("reviews").select("*", { count: "exact", head: true });
  const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { count: flagCount } = await supabase.from("review_flags").select("*", { count: "exact", head: true });

  const { data: flaggedReviews } = await supabase.from("review_flags").select("*, review:reviews(title, content, user_id), reporter:profiles!review_flags_user_id_fkey(full_name)").order("created_at", { ascending: false }).limit(10);
  const { data: recentReviews } = await supabase.from("reviews").select("*, profile:profiles(full_name), hostel:hostels(name)").order("created_at", { ascending: false }).limit(5);

  return (
    <><Header /><main className="page-wrapper"><section className={styles.page}><div className="container">
      <h1>Admin Dashboard</h1>
      <div className={styles.statsGrid}>
        <div className={styles.stat}><span className={styles.statNum}>{hostelCount || 0}</span><span>Hostels</span></div>
        <div className={styles.stat}><span className={styles.statNum}>{reviewCount || 0}</span><span>Reviews</span></div>
        <div className={styles.stat}><span className={styles.statNum}>{userCount || 0}</span><span>Users</span></div>
        <div className={styles.stat}><span className={styles.statNum}>{flagCount || 0}</span><span>Flags</span></div>
      </div>
      <div className={styles.panels}>
        <div className={styles.panel}>
          <h2>🚩 Flagged Reviews</h2>
          {flaggedReviews && flaggedReviews.length > 0 ? flaggedReviews.map((f) => (
            <div key={f.id} className={styles.flagItem}>
              <p><strong>Reason:</strong> {f.reason}</p>
              <p className={styles.flagMeta}>Review: &quot;{(f.review as any)?.title}&quot; — Reported by {(f.reporter as any)?.full_name || "Unknown"} on {formatDate(f.created_at)}</p>
            </div>
          )) : <p className={styles.empty}>No flagged reviews</p>}
        </div>
        <div className={styles.panel}>
          <h2>📝 Recent Reviews</h2>
          {recentReviews && recentReviews.length > 0 ? recentReviews.map((r) => (
            <div key={r.id} className={styles.recentItem}>
              <h4>{r.title}</h4>
              <p className={styles.flagMeta}>by {(r.profile as any)?.full_name || "Anonymous"} for {(r.hostel as any)?.name} — {formatDate(r.created_at)}</p>
            </div>
          )) : <p className={styles.empty}>No reviews yet</p>}
        </div>
      </div>
    </div></section></main><Footer /></>
  );
}
