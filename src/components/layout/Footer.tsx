import Link from "next/link";
import styles from "./Footer.module.css";
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <span className={styles.brand}>🏠 KL Hostel Hub</span>
        <nav className={styles.nav}>
          <Link href="/hostels">Hostels</Link>
          <Link href="/login">Sign In</Link>
        </nav>
        <span className={styles.copy}>© {new Date().getFullYear()} KL University Students</span>
      </div>
    </footer>
  );
}
