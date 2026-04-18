"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./AdminPendingPanel.module.css";

interface PendingHostel {
  id: string; name: string; location: string; gender: string;
  submitted_by: string; created_at: string; status: string;
}

export default function AdminPendingPanel({ hostels }: { hostels: PendingHostel[] }) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    const note = action === "reject" ? prompt("Reason for rejection (optional):") : null;
    setProcessing(id);
    const res = await fetch("/api/admin/hostels/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostel_id: id, action, note }),
    });
    setProcessing(null);
    if (res.ok) router.refresh();
    else alert("Action failed");
  };

  if (hostels.length === 0) return <p className={styles.empty}>No pending hostels</p>;

  return (
    <div className={styles.list}>
      {hostels.map((h) => (
        <div key={h.id} className={styles.item}>
          <div className={styles.info}>
            <strong>{h.name}</strong>
            <span>{h.location || "No location"} · {h.gender}</span>
            <span className={styles.date}>{new Date(h.created_at).toLocaleDateString()}</span>
          </div>
          <div className={styles.actions}>
            <button
              className={styles.approveBtn}
              onClick={() => handleAction(h.id, "approve")}
              disabled={processing === h.id}
            >✓ Approve</button>
            <button
              className={styles.rejectBtn}
              onClick={() => handleAction(h.id, "reject")}
              disabled={processing === h.id}
            >✕ Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
