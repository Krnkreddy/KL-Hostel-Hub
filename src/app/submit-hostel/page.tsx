"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import styles from "./page.module.css";

const AMENITY_OPTIONS = ["WiFi", "Fan", "AC", "Mess", "CCTV", "Hot Water", "Gym", "Laundry", "Parking", "Power Backup"];

export default function SubmitHostelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "", location: "", price_min: "", price_max: "",
    gender: "co-ed", description: "", distance: "", amenities: [] as string[],
  });

  const toggle = (a: string) => setForm((p) => ({
    ...p, amenities: p.amenities.includes(a) ? p.amenities.filter((x) => x !== a) : [...p.amenities, a],
  }));

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Hostel name is required"); return; }
    setLoading(true); setError(null);

    const res = await fetch("/api/hostels/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price_min: Number(form.price_min) || 0,
        price_max: Number(form.price_max) || 0,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (res.ok) {
      setSuccess(true);
    } else {
      setError(data.error || "Failed to submit. Please sign in first.");
    }
  };

  if (success) {
    return (
      <><Header /><main className="page-wrapper"><section className={styles.page}><div className="container" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className={styles.successCard}>
          <span style={{ fontSize: "3rem" }}>🎉</span>
          <h2>Hostel Submitted!</h2>
          <p>Your submission is now pending community votes and admin approval.</p>
          <p>Once it gets enough upvotes or admin approval, it will appear in the main listings.</p>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <Link href="/community" className="btn btn-secondary">View Pending Hostels</Link>
            <Link href="/hostels" className="btn btn-primary">Back to Hostels</Link>
          </div>
        </div>
      </div></section></main><Footer /></>
    );
  }

  return (
    <><Header /><main className="page-wrapper"><section className={styles.page}><div className="container" style={{ maxWidth: 640, margin: "0 auto" }}>
      <nav style={{ marginBottom: "1.5rem" }}>
        <Link href="/hostels" style={{ fontSize: "0.875rem", color: "var(--color-on-surface-variant)" }}>← Back to Hostels</Link>
      </nav>
      <h1 className={styles.title}>Suggest a Hostel</h1>
      <p className={styles.subtitle}>Know a hostel near KL University? Submit it for community review!</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className="form-group">
          <label className="form-label">Hostel Name *</label>
          <input className="form-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Sri Sai Boys Hostel" required />
        </div>
        <div className="form-group">
          <label className="form-label">Location / Address</label>
          <input className="form-input" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Main Road, Vaddeswaram" />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Tell us about this hostel..." rows={3} maxLength={1000} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select className="form-input" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="co-ed">Co-Ed</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Distance from Campus</label>
            <input className="form-input" value={form.distance} onChange={(e) => set("distance", e.target.value)} placeholder="e.g. 1.5 km" />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Min Price (₹/mo)</label>
            <input className="form-input" type="number" value={form.price_min} onChange={(e) => set("price_min", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Max Price (₹/mo)</label>
            <input className="form-input" type="number" value={form.price_max} onChange={(e) => set("price_max", e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Amenities</label>
          <div className={styles.amenityChips}>
            {AMENITY_OPTIONS.map((a) => (
              <button key={a} type="button" onClick={() => toggle(a)}
                className={`${styles.chip} ${form.amenities.includes(a) ? styles.chipActive : ""}`}>{a}</button>
            ))}
          </div>
        </div>

        {error && <div className={styles.errorBox}>⚠️ {error}</div>}

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Submitting..." : "Submit for Review"}
        </button>
      </form>
    </div></section></main><Footer /></>
  );
}
