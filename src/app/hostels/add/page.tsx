"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const AMENITY_OPTIONS = [
  "Mess", "WiFi", "AC", "Hot Water", "Power Backup", "CCTV",
  "Security Guard", "Laundry", "Washing Machine", "Gym", "Parking",
  "RO Drinking Water", "Cleaning Service", "Study Room",
  "Fee Delay Tolerance", "Maintenance Support", "Visitor Allowed", "Elevator",
];

export default function AddHostelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", address: "", gender: "male",
    price_min: "", price_max: "", distance_from_campus: "",
    amenities: [] as string[], contact_phone: "", contact_email: "",
    is_verified: false,
  });

  const toggleAmenity = (a: string) => {
    setForm((p) => ({
      ...p,
      amenities: p.amenities.includes(a) ? p.amenities.filter((x) => x !== a) : [...p.amenities, a],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    setLoading(true);
    setError(null);

    const slug = form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const res = await fetch("/api/hostels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        slug,
        address: form.address.trim(),
        gender: form.gender,
        price_min: Number(form.price_min) || 0,
        price_max: Number(form.price_max) || 0,
        distance_from_campus: Number(form.distance_from_campus) || 0,
        amenities: form.amenities,
        contact_phone: form.contact_phone.trim() || null,
        contact_email: form.contact_email.trim() || null,
        is_verified: form.is_verified,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      router.push("/hostels");
      router.refresh();
    } else {
      setError(data.error || "Failed to add hostel.");
    }
  };

  const set = (key: string, val: string | boolean) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <>
      <Header />
      <main className="page-wrapper">
        <section style={{ padding: "2rem 0 4rem" }}>
          <div className="container" style={{ maxWidth: 640, margin: "0 auto" }}>
            <nav style={{ marginBottom: "1.5rem" }}>
              <Link href="/hostels" style={{ fontSize: "0.875rem", color: "var(--color-on-surface-variant)" }}>← Back to Hostels</Link>
            </nav>
            <h1 style={{ fontSize: "1.875rem", marginBottom: 8 }}>Add New Hostel</h1>
            <p style={{ color: "var(--color-on-surface-variant)", marginBottom: "2rem" }}>Admin only — add a hostel listing</p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label">Hostel Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="e.g. Main Road, Vaddeswaram" />
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
                  <label className="form-label">Distance (km)</label>
                  <input className="form-input" type="number" step="0.1" value={form.distance_from_campus} onChange={(e) => set("distance_from_campus", e.target.value)} placeholder="e.g. 1.5" />
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
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {AMENITY_OPTIONS.map((a) => (
                    <button key={a} type="button" onClick={() => toggleAmenity(a)}
                      style={{
                        padding: "4px 12px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, border: "none", cursor: "pointer",
                        background: form.amenities.includes(a) ? "var(--color-secondary)" : "var(--color-surface-container-low)",
                        color: form.amenities.includes(a) ? "white" : "var(--color-on-surface-variant)",
                      }}>{a}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input className="form-input" value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input className="form-input" type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_verified} onChange={(e) => set("is_verified", e.target.checked)} />
                Mark as Verified
              </label>

              {error && (
                <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, color: "var(--color-error)", fontSize: "0.875rem" }}>
                  ⚠️ {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: "100%" }}>
                {loading ? "Adding..." : "Add Hostel"}
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
