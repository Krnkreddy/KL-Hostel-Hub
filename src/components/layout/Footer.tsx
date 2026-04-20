import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.brand}>KL Hostel Hub</span>
        <span className={styles.copy}>© {new Date().getFullYear()} KL Hostel Hub. For KL University Students.</span>
        <nav className={styles.links}>
          <a href="mailto:findthehostel@kluniversity.in">Contact Us</a>
          <a href="mailto:findthehostel@kluniversity.in">Report Issue</a>
        </nav>
      </div>
    </footer>
  );
}
