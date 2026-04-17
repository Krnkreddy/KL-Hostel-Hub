import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.brand}>FindTheHostel</span>
        <span className={styles.copy}>© {new Date().getFullYear()} FindTheHostel. For KL University Students.</span>
        <nav className={styles.links}>
          <Link href="#">Terms of Service</Link>
          <Link href="#">Privacy Policy</Link>
          <Link href="#">Report Issue</Link>
        </nav>
      </div>
    </footer>
  );
}
