import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES, REVIEW_IMAGE_BUCKET, MAX_REVIEW_IMAGES } from "@/lib/constants";
import { detectFileType } from "@/lib/utils/validation";

export async function POST(request: Request) {
  // Auth check with user client
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try { formData = await request.formData(); } catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file = formData.get("file") as File | null;
  const reviewId = formData.get("review_id") as string | null;
  if (!file || !reviewId) return NextResponse.json({ error: "File and review_id required" }, { status: 400 });
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return NextResponse.json({ error: "Only JPEG, PNG, WebP allowed" }, { status: 400 });
  if (file.size > MAX_IMAGE_SIZE_BYTES) return NextResponse.json({ error: "Max 5MB" }, { status: 400 });

  // Read file into buffer FIRST (before any other reads)
  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  // Detect file type from the buffer
  const headerBytes = new Uint8Array(arrayBuffer.slice(0, 12));
  let detected: string | null = null;
  if (headerBytes[0] === 0xff && headerBytes[1] === 0xd8 && headerBytes[2] === 0xff) detected = "image/jpeg";
  else if (headerBytes[0] === 0x89 && headerBytes[1] === 0x50 && headerBytes[2] === 0x4e && headerBytes[3] === 0x47) detected = "image/png";
  else if (headerBytes[0] === 0x52 && headerBytes[1] === 0x49 && headerBytes[2] === 0x46 && headerBytes[3] === 0x46 &&
           headerBytes[8] === 0x57 && headerBytes[9] === 0x45 && headerBytes[10] === 0x42 && headerBytes[11] === 0x50) detected = "image/webp";

  if (!detected || !ALLOWED_IMAGE_TYPES.includes(detected)) {
    return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
  }

  // Verify review belongs to user
  const { data: review } = await supabase.from("reviews").select("user_id").eq("id", reviewId).single();
  if (!review || review.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Check image count limit
  const { count } = await supabase.from("review_images").select("*", { count: "exact", head: true }).eq("review_id", reviewId);
  if ((count || 0) >= MAX_REVIEW_IMAGES) return NextResponse.json({ error: `Max ${MAX_REVIEW_IMAGES} images` }, { status: 400 });

  // Use service client for storage upload (bypasses storage RLS)
  const serviceClient = await createServiceClient();
  const extMap: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extMap[detected] || "jpg"}`;
  const filePath = `${user.id}/${reviewId}/${safeName}`;

  console.log("[upload] Uploading to:", filePath, "size:", fileBuffer.length, "type:", detected);

  // Upload the Buffer (not the File object — avoids stream exhaustion issues)
  const { error: ue } = await serviceClient.storage.from(REVIEW_IMAGE_BUCKET).upload(filePath, fileBuffer, {
    cacheControl: "3600",
    upsert: false,
    contentType: detected,
  });

  if (ue) {
    console.error("[upload] Storage error:", ue);
    return NextResponse.json({ error: "Upload failed: " + ue.message }, { status: 500 });
  }

  const { data: urlData } = serviceClient.storage.from(REVIEW_IMAGE_BUCKET).getPublicUrl(filePath);
  console.log("[upload] Public URL:", urlData.publicUrl);

  // Insert record into review_images
  const { data: rec, error: de } = await serviceClient.from("review_images").insert({
    review_id: reviewId,
    image_url: urlData.publicUrl,
  }).select().single();

  if (de) {
    console.error("[upload] DB insert error:", de);
    await serviceClient.storage.from(REVIEW_IMAGE_BUCKET).remove([filePath]);
    return NextResponse.json({ error: "Failed to save image record" }, { status: 500 });
  }

  console.log("[upload] Success! Record:", rec.id);
  return NextResponse.json({ data: rec, error: null }, { status: 201 });
}
