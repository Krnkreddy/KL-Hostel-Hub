"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function EditNameButton({ userId, currentName, className }: {
  userId: string; currentName: string; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === currentName) { setEditing(false); return; }
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ full_name: trimmed }).eq("id", userId);
    setSaving(false);

    if (!error) {
      setEditing(false);
      // Full page reload preserves auth cookies properly (unlike router.refresh)
      window.location.reload();
    } else {
      console.error("[profile] Update error:", error);
      alert("Failed to update name: " + error.message);
    }
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
