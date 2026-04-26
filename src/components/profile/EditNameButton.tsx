"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditNameButton({ userId, currentName, className }: {
  userId: string; currentName: string; className?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) { setEditing(false); return; }
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: trimmed }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        alert(data.error || "Failed to update name.");
      }
    } catch {
      alert("Network error. Please try again.");
    }

    setSaving(false);
  };

  if (!editing) {
    return (
      <button className={className} onClick={() => setEditing(true)} title="Edit name">
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", width: "100%" }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={100}
        autoFocus
        style={{
          flex: 1, padding: "6px 12px", border: "1px solid var(--color-outline-variant)",
          borderRadius: "var(--radius-lg)", fontSize: "var(--text-sm)",
          fontFamily: "var(--font-body)", background: "var(--color-surface-container-low)",
          color: "var(--color-on-surface)", outline: "none",
        }}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
      />
      <button
        onClick={save} disabled={saving}
        style={{
          padding: "6px 12px", background: "var(--color-secondary)",
          color: "white", border: "none", borderRadius: "var(--radius-lg)",
          fontSize: "var(--text-xs)", fontWeight: 600, cursor: "pointer",
        }}
      >
        {saving ? "..." : "Save"}
      </button>
    </div>
  );
}
