import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils/format";
import styles from "./page.module.css";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: reviews } = await supabase.from("reviews").select("*, hostel:hostels(name, slug), rating:ratings(overall)").eq("user_id", user.id).order("created_at", { ascending: false });

  return (
    <><Header /><main className="page-wrapper"><section className={styles.page}><div className="container">
      <h1>Your Profile</h1>
      <div className={styles.profileCard}>
        <div className={styles.avatar}>{(profile?.full_name || user.email || "?")[0].toUpperCase()}</div>
        <div><h2>{profile?.full_name || "Student"}</h2><p className={styles.email}>{user.email}</p><p className={styles.meta}>Member since {formatDate(user.created_at)}</p></div>
      </div>
      <h2 className={styles.sectionTitle}>Your Reviews ({reviews?.length || 0})</h2>
      {reviews && reviews.length > 0 ? (
        <div className={styles.reviewList}>{reviews.map((r) => (
          <div key={r.id} className={styles.reviewItem}>
            <div className={styles.reviewHeader}><h3>{r.title}</h3><span className={styles.rating}>★ {(r.rating as any)?.overall || "–"}/5</span></div>
            <p className={styles.hostelName}>{(r.hostel as any)?.name}</p>
            <p className={styles.reviewContent}>{r.content.slice(0, 200)}{r.content.length > 200 ? "..." : ""}</p>
            <span className={styles.date}>{formatDate(r.created_at)}</span>
          </div>
        ))}</div>
      ) : <p className={styles.empty}>You haven&apos;t written any reviews yet.</p>}
    </div></section></main><Footer /></>
  );
}
