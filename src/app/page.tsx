import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import styles from "./page.module.css";

export const metadata = {
  title: "KL Hostel Hub — Honest hostel reviews for KL University students",
  description: "Find the perfect hostel near KL University. Real reviews from verified students. Free, always.",
};

const STEPS = [
  { icon: "🔍", title: "Search & Discover", desc: "Browse hostels near KL University filtered by rating, distance, price, and gender." },
  { icon: "🎓", title: "Verified Reviews Only", desc: "Only KL University students (verified by KLU email) can write reviews — no fakes." },
  { icon: "⭐", title: "Rate Every Aspect", desc: "Rate food, cleanliness, WiFi, safety, value, and management separately for honest insights." },
  { icon: "🏠", title: "Make the Right Choice", desc: "Pick your hostel with confidence knowing the reviews are from real students like you." },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="page-wrapper">
        <div className={styles.page}>
          {/* Hero */}
          <section className={styles.hero}>
            <div className={styles.heroBlobA} />
            <div className={styles.heroBlobB} />

            <div className={styles.badge}>
              🏠 Trusted by KL University Students
            </div>

            <h1 className={styles.heroTitle}>
              Find Your{" "}
              <span className={styles.heroTitleAccent}>Perfect Hostel</span>
              <br />
              <span className={styles.heroTitleAccent2}>Near Campus</span>
            </h1>

            <p className={styles.heroSub}>
              Real reviews from verified KL University students. No fake ratings — just honest feedback to help you choose the best hostel.
            </p>

            <div className={styles.ctaRow}>
              <Link href="/hostels" className="btn btn-primary btn-lg" id="browse-hostels-btn">
                Browse Hostels
              </Link>
              <Link href="/login" className="btn btn-tonal btn-lg" id="write-review-btn">
                Write a Review
              </Link>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <strong className={styles.statNum}>8+</strong>
                <span className={styles.statLabel}>Hostels</span>
              </div>
              <div className={styles.stat}>
                <strong className={styles.statNum}>100%</strong>
                <span className={styles.statLabel}>Verified Students</span>
              </div>
              <div className={styles.stat}>
                <strong className={styles.statNum}>Free</strong>
                <span className={styles.statLabel}>Always</span>
              </div>
            </div>
          </section>

          {/* How it works */}
          <section className={styles.howSection}>
            <div className="container">
              <h2>How KL Hostel Hub Works</h2>
              <div className={styles.stepsGrid}>
                {STEPS.map((step) => (
                  <div key={step.title} className={styles.step}>
                    <div className={styles.stepIcon}>{step.icon}</div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
