import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/utils/validation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: reviewId } = await params;
  if (!isValidUUID(reviewId)) return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const voteType = body.vote_type;
  if (!voteType || !["helpful", "not_helpful"].includes(voteType)) {
    return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
  }

  // Check existing vote
  const { data: existing } = await supabase
    .from("review_votes")
    .select("id, vote_type")
    .eq("review_id", reviewId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    if (existing.vote_type === voteType) {
      // Toggle off — delete the vote
      await supabase.from("review_votes").delete().eq("id", existing.id);
      return NextResponse.json({ action: "removed" });
    } else {
      // Change vote type
      await supabase.from("review_votes").update({ vote_type: voteType }).eq("id", existing.id);
      return NextResponse.json({ action: "changed", vote_type: voteType });
    }
  }

  // New vote
  const { error } = await supabase.from("review_votes").insert({
    review_id: reviewId,
    user_id: user.id,
    vote_type: voteType,
  });

  if (error) return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  return NextResponse.json({ action: "voted", vote_type: voteType });
}
