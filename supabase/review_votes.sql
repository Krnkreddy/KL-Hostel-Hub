-- Review votes table for helpful/not-helpful voting
CREATE TABLE IF NOT EXISTS public.review_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(review_id, user_id)
);

ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read vote counts
CREATE POLICY "Public read votes" ON public.review_votes FOR SELECT USING (true);
-- Authenticated users can insert their own votes
CREATE POLICY "Auth insert votes" ON public.review_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Users can update their own votes
CREATE POLICY "Auth update votes" ON public.review_votes FOR UPDATE USING (auth.uid() = user_id);
-- Users can delete their own votes
CREATE POLICY "Auth delete votes" ON public.review_votes FOR DELETE USING (auth.uid() = user_id);
