"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./NotificationBadge.module.css";

interface Notification {
  id: string; message: string; type: string; link?: string;
  is_read: boolean; created_at: string;
}

export default function NotificationBadge() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifs.filter((n) => !n.is_read).length;

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.ok ? r.json() : []).then(setNotifs).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const markRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifs((p) => p.map((n) => ({ ...n, is_read: true })));
  };

  const handleOpen = () => {
    setOpen(!open);
    if (!open && unread > 0) markRead();
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      <button className={styles.btn} onClick={handleOpen} aria-label="Notifications">
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>notifications</span>
        {unread > 0 && <span className={styles.badge}>{unread}</span>}
      </button>
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropHeader}>
            <strong>Notifications</strong>
            {unread > 0 && <button className={styles.markRead} onClick={markRead}>Mark all read</button>}
          </div>
          {notifs.length > 0 ? (
            <div className={styles.list}>
              {notifs.map((n) => (
                <a key={n.id} href={n.link || "#"} className={`${styles.item} ${!n.is_read ? styles.itemUnread : ""}`} onClick={() => setOpen(false)}>
                  <p>{n.message}</p>
                  <span className={styles.time}>
                    {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>No notifications</p>
          )}
        </div>
      )}
    </div>
  );
}
