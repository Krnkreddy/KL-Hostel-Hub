import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.brand}>KL Hostel Hub</span>
        <div className={styles.contactRow}>
          <a href="https://wa.me/918465931807" target="_blank" rel="noopener noreferrer" className={styles.contactBtn}>
            💬 WhatsApp Us
          </a>
          <a href="mailto:antmannxx01@gmail.com" className={styles.contactBtn}>
            ✉️ Email Us
          </a>
        </div>
        <span className={styles.copy}>© {new Date().getFullYear()} KL Hostel Hub. For KL University Students.</span>
      </div>
    </footer>
  );
}
