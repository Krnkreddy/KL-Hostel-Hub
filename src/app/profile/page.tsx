import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/utils/format";
import DeleteReviewButton from "@/components/reviews/DeleteReviewButton";
import styles from "./page.module.css";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/profile");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: reviews } = await supabase
    .from("reviews").select("*, rating:ratings(*), hostel:hostels(name, id)")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Student";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const memberSince = new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <>
      <Header />
      <main className="page-wrapper">
        <section className={styles.page}>
          <div className="container">
            <div className={styles.layout}>
              {/* Sidebar */}
              <aside className={styles.sidebar}>
                {/* Profile card */}
                <div className={styles.profileCard}>
                  <div className={styles.avatar}>{initials}</div>
                  <h1 className={styles.profileName}>{displayName}</h1>
                  <p className={styles.profileMeta}>Member since {memberSince}</p>

                  <div className={styles.statChips}>
                    <div className={styles.statChip}>
                      <span className={styles.statLabel}>Reviews Written</span>
                      <span className={styles.statValue}>{reviews?.length || 0}</span>
                    </div>
                    <div className={styles.statChip}>
                      <span className={styles.statLabel}>Email</span>
                      <span className={styles.statValue} style={{ fontSize: "0.75rem" }}>{user.email}</span>
                    </div>
                  </div>
                  <div className={styles.divider} />
                </div>

                {/* Settings card */}
                <div className={styles.settingsCard}>
                  <h2>Account Settings</h2>
                  <div className={styles.settingsActions}>
                    <Link href="/auth/signout" className={styles.btnSignOut}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
                      Sign Out
                    </Link>
                  </div>
                </div>
              </aside>

              {/* Main */}
              <section className={styles.main}>
                <div className={styles.tabs}>
                  <button className={`${styles.tab} ${styles.tabActive}`}>My Reviews</button>
                  <button className={styles.tab} style={{ pointerEvents: "none", opacity: 0.5 }}>My Votes</button>
                  <button className={styles.tab} style={{ pointerEvents: "none", opacity: 0.5 }}>Pending Confirmations</button>
                </div>

                {reviews && reviews.length > 0 ? (
                  <div className={styles.reviewsList}>
                    {reviews.map((r) => (
                      <article key={r.id} className={styles.reviewItem}>
                        <div className={styles.reviewItemTop}>
                          <div>
                            <h3 className={styles.reviewItemName}>
                              <Link href={`/hostels/${r.hostel?.id}`}>{r.hostel?.name || "Unknown Hostel"}</Link>
                            </h3>
                            <div className={styles.reviewItemStars}>
                              {[1,2,3,4,5].map((s) => (
                                <span key={s} className={`material-symbols-outlined ${s <= (r.rating?.overall || 0) ? "icon-fill" : ""}`} style={{ fontSize: 16 }}>
                                  star
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className={styles.reviewItemDate}>{formatRelativeTime(r.created_at)}</span>
                        </div>
                        <p className={styles.reviewItemContent}>{r.content}</p>
                        <div className={styles.reviewItemActions}>
                          <Link href={`/hostels/${r.hostel?.id}/review`} className={styles.editBtn}>Edit</Link>
                          <DeleteReviewButton reviewId={r.id} className={styles.delBtn} />
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className={styles.empty}>You haven&apos;t written any reviews yet.<br /><Link href="/hostels" style={{ color: "var(--color-secondary)", fontWeight: 600 }}>Browse hostels</Link> to get started!</p>
                )}
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
