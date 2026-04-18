import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Feedback section */}
      <div className={styles.feedbackBar}>
        <div className={styles.feedbackInner}>
          <div className={styles.feedbackText}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>feedback</span>
            <p>Have suggestions or found an issue? We&apos;d love to hear from you!</p>
          </div>
          <a href="mailto:findthehostel@kluniversity.in" className={styles.feedbackBtn}>
            Send Feedback
          </a>
        </div>
      </div>

      <div className={styles.inner}>
        <span className={styles.brand}>FindTheHostel</span>
        <span className={styles.copy}>© {new Date().getFullYear()} FindTheHostel. For KL University Students.</span>
        <nav className={styles.links}>
          <Link href="#">Terms of Service</Link>
          <Link href="#">Privacy Policy</Link>
          <a href="mailto:findthehostel@kluniversity.in">Report Issue</a>
        </nav>
      </div>
    </footer>
  );
}
