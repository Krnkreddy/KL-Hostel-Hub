"use client";
import styles from "./StarRating.module.css";
interface Props { label?: string; value: number; onChange?: (v: number) => void; size?: "sm"|"md"|"lg"; readonly?: boolean; }
export default function StarRating({ label, value, onChange, size = "md", readonly = false }: Props) {
  return (
    <div className={`${styles.wrapper} ${styles[size]}`}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.stars}>
        {[1,2,3,4,5].map((star) => (
          <button key={star} type="button" className={`${styles.star} ${star <= value ? styles.filled : ""}`}
            onClick={() => !readonly && onChange?.(star)} disabled={readonly}>★</button>
        ))}
      </div>
    </div>
  );
}
