import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <>
      <Header />
      <main className="page-wrapper">
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroContent}>
              <span className={styles.heroChip}>🏠 Trusted by KL University Students</span>
              <h1 className={styles.heroTitle}>Find Your <span>Perfect Hostel</span> Near Campus</h1>
              <p className={styles.heroDesc}>Real reviews from verified KL University students. No fake ratings — just honest feedback to help you choose the best hostel.</p>
              <div className={styles.heroCtas}>
                <Link href="/hostels" className="btn btn-primary btn-lg">Browse Hostels</Link>
                <Link href="/login" className="btn btn-secondary btn-lg">Write a Review</Link>
              </div>
              <div className={styles.stats}>
                <div className={styles.stat}><span className={styles.statNum}>8+</span><span>Hostels</span></div>
                <div className={styles.stat}><span className={styles.statNum}>100%</span><span>Verified Students</span></div>
                <div className={styles.stat}><span className={styles.statNum}>Free</span><span>Always</span></div>
              </div>
            </div>
          </div>
        </section>
        <section className={styles.howItWorks}>
          <div className="container">
            <h2 className={styles.sectionTitle}>How It Works</h2>
            <div className={styles.steps}>
              <div className={styles.step}><span className={styles.stepIcon}>🔍</span><h3>Browse</h3><p>Explore hostels near KL University with filters and ratings</p></div>
              <div className={styles.step}><span className={styles.stepIcon}>📝</span><h3>Review</h3><p>Share your honest experience to help fellow students</p></div>
              <div className={styles.step}><span className={styles.stepIcon}>🤝</span><h3>Connect</h3><p>Make informed decisions based on real student feedback</p></div>
            </div>
          </div>
        </section>
        <section className={styles.cta}>
          <div className="container" style={{textAlign:"center"}}>
            <h2>Ready to Find Your Hostel?</h2>
            <p style={{color:"var(--color-text-secondary)", margin:"1rem 0 2rem"}}>Join verified KL University students sharing honest reviews.</p>
            <Link href="/hostels" className="btn btn-primary btn-lg">Get Started</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
