"use client";
import { useState, use, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StarRating from "@/components/ui/StarRating";
import { createClient } from "@/lib/supabase/client";
import type { ReviewFormData } from "@/types";
import { MAX_REVIEW_IMAGES, MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import styles from "./page.module.css";

const CATEGORY_RATINGS = [
  { key: "cleanliness", label: "Cleanliness", icon: "🧹" },
  { key: "food_quality", label: "Food Quality", icon: "🍽️" },
  { key: "wifi_quality", label: "WiFi", icon: "📶" },
  { key: "safety", label: "Safety", icon: "🔒" },
  { key: "value_for_money", label: "Value for Money", icon: "💰" },
  { key: "management", label: "Management", icon: "👥" },
] as const;

export default function WriteReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: hostelId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ReviewFormData>({
    title: "", content: "", stay_duration: "", overall: 0, cleanliness: 0, food_quality: 0,
    wifi_quality: 0, safety: 0, value_for_money: 0, management: 0, images: [],
  });

  // Auto-calculate overall as average of 6 category ratings
  const computedOverall = useMemo(() => {
    const cats = [formData.cleanliness, formData.food_quality, formData.wifi_quality,
      formData.safety, formData.value_for_money, formData.management];
    const rated = cats.filter((v) => v > 0);
    if (rated.length === 0) return 0;
    return Math.round(rated.reduce((a, b) => a + b, 0) / rated.length);
  }, [formData.cleanliness, formData.food_quality, formData.wifi_quality,
    formData.safety, formData.value_for_money, formData.management]);

  // ✅ BUG-02 FIX: Memoize preview URLs
  const previewUrls = useMemo(() => {
    return formData.images.map((f) => URL.createObjectURL(f));
  }, [formData.images]);

  useEffect(() => {
    return () => { previewUrls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [previewUrls]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) { setError("Only JPEG, PNG, WebP allowed"); return; }
      if (f.size > MAX_IMAGE_SIZE_BYTES) { setError("Each image must be under 5MB"); return; }
    }
    if (formData.images.length + files.length > MAX_REVIEW_IMAGES) {
      setError(`Max ${MAX_REVIEW_IMAGES} images`); return;
    }
    setError(null);
    setFormData((p) => ({ ...p, images: [...p.images, ...files] }));
  };

  const removeImage = (index: number) => {
    setFormData((p) => ({ ...p, images: p.images.filter((_, i) => i !== index) }));
  };

  const validate = (): string | null => {
    if (formData.content.trim().length < 10) return "Review must be at least 10 characters";
    for (const c of CATEGORY_RATINGS) {
      if (formData[c.key as keyof ReviewFormData] === 0) return `Please rate ${c.label}`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Auto-generate title from first 60 chars of content
      const autoTitle = formData.content.trim().substring(0, 60) + (formData.content.trim().length > 60 ? "..." : "");

      // Step 1: Create review
      const { data: review, error: re } = await supabase
        .from("reviews")
        .insert({
          hostel_id: hostelId,
          user_id: user.id,
          title: autoTitle,
          content: formData.content.trim(),
          stay_duration: formData.stay_duration || null,
        })
        .select()
        .single();

      if (re) {
        setError(re.code === "23505" ? "You have already reviewed this hostel" : "Failed to create review.");
        setLoading(false);
        return;
      }

      // Step 2: Create ratings (overall auto-computed)
      const { error: ratErr } = await supabase.from("ratings").insert({
        review_id: review.id,
        overall: computedOverall,
        cleanliness: formData.cleanliness,
        food_quality: formData.food_quality,
        wifi_quality: formData.wifi_quality,
        safety: formData.safety,
        value_for_money: formData.value_for_money,
        management: formData.management,
      });

      if (ratErr) {
        await supabase.from("reviews").delete().eq("id", review.id);
        setError("Failed to save ratings.");
        setLoading(false);
        return;
      }

      // ✅ BUG-01 FIX: Upload images through /api/upload
      for (const file of formData.images) {
        const body = new FormData();
        body.append("file", file);
        body.append("review_id", review.id);
        const res = await fetch("/api/upload", { method: "POST", body });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.warn("Image upload failed:", data.error || res.statusText);
        }
      }

      router.push(`/hostels/${hostelId}`);
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="page-wrapper">
        <section className={styles.page}>
          <div className="container">
            <nav className={styles.breadcrumb}>
              <Link href={`/hostels/${hostelId}`}>← Back to Hostel</Link>
            </nav>
            <div className={styles.formWrapper}>
              <h1 className={styles.title}>Write a Review</h1>
              <p className={styles.subtitle}>Share your experience to help other students</p>
              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Ratings */}
                <div className={styles.ratingsSection}>
                  <h2>Rate Your Experience</h2>
                  <div className={styles.ratingsList}>
                    {CATEGORY_RATINGS.map((c) => (
                      <StarRating
                        key={c.key}
                        label={`${c.icon} ${c.label}`}
                        value={formData[c.key as keyof ReviewFormData] as number}
                        onChange={(v) => setFormData((p) => ({ ...p, [c.key]: v }))}
                        size="lg"
                      />
                    ))}
                  </div>
                  {/* Auto-calculated overall */}
                  {computedOverall > 0 && (
                    <div className={styles.overallBadge}>
                      Overall: <strong>{computedOverall}/5</strong> ★
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="form-group">
                  <label className="form-label" htmlFor="review-content">Your Review *</label>
                  <textarea
                    id="review-content" className="form-textarea"
                    placeholder="Describe your experience in detail" value={formData.content}
                    onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                    maxLength={5000} rows={6} required
                  />
                  <span className={styles.charCount}>{formData.content.length}/5000</span>
                </div>

                {/* Stay Duration */}
                <div className="form-group">
                  <label className="form-label" htmlFor="stay-duration">How long did you stay?</label>
                  <select
                    id="stay-duration" className="form-input" value={formData.stay_duration}
                    onChange={(e) => setFormData((p) => ({ ...p, stay_duration: e.target.value }))}
                  >
                    <option value="">Select duration</option>
                    <option value="Less than 3 months">Less than 3 months</option>
                    <option value="3-6 months">3-6 months</option>
                    <option value="6 months - 1 year">6 months - 1 year</option>
                    <option value="1-2 years">1-2 years</option>
                    <option value="2+ years">2+ years</option>
                  </select>
                </div>

                {/* Image Upload */}
                <div className="form-group">
                  <label className="form-label">Photos (optional, max {MAX_REVIEW_IMAGES})</label>
                  <div className={styles.imageUpload}>
                    <label htmlFor="image-upload" className={styles.uploadArea}>
                      <span>📷 Click to upload</span>
                      <span className={styles.uploadNote}>JPEG, PNG, WebP • Max 5MB</span>
                    </label>
                    <input
                      id="image-upload" type="file" accept="image/jpeg,image/png,image/webp"
                      multiple onChange={handleImageChange} style={{ display: "none" }}
                    />
                  </div>
                  {formData.images.length > 0 && (
                    <div className={styles.imagePreviews}>
                      {formData.images.map((_, i) => (
                        <div key={i} className={styles.imagePreview}>
                          <img src={previewUrls[i]} alt={`Preview ${i + 1}`} />
                          <button type="button" className={styles.removeImage} onClick={() => removeImage(i)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Error near submit */}
                {error && (
                  <div className={styles.errorAlert}>
                    <span>⚠️</span>
                    <p>{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit" className="btn btn-primary btn-lg" disabled={loading}
                  id="submit-review-button" style={{ width: "100%" }}
                >
                  {loading ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
