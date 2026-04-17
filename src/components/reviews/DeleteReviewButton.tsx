"use client";
import { useRouter } from "next/navigation";

export default function DeleteReviewButton({ reviewId, className }: { reviewId: string; className?: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to delete review.");
    }
  };

  return (
    <button className={className} onClick={handleDelete}>
      Delete
    </button>
  );
}
