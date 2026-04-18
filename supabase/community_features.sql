-- ============================================
-- KL Hostel Hub — Community Features Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. PENDING HOSTELS (user submissions)
CREATE TABLE IF NOT EXISTS public.pending_hostels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 200),
  location TEXT NOT NULL DEFAULT '',
  price_min INTEGER NOT NULL DEFAULT 0,
  price_max INTEGER NOT NULL DEFAULT 0,
  gender TEXT NOT NULL DEFAULT 'co-ed' CHECK (gender IN ('male', 'female', 'co-ed')),
  description TEXT DEFAULT '',
  distance TEXT DEFAULT '',
  amenities TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pending_hostels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view pending hostels" ON public.pending_hostels FOR SELECT USING (true);
CREATE POLICY "Auth users can submit hostels" ON public.pending_hostels FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Admins manage pending hostels" ON public.pending_hostels FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins delete pending hostels" ON public.pending_hostels FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. HOSTEL VOTES (community validation)
CREATE TABLE IF NOT EXISTS public.hostel_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID NOT NULL REFERENCES public.pending_hostels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hostel_id, user_id)
);

ALTER TABLE public.hostel_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read hostel votes" ON public.hostel_votes FOR SELECT USING (true);
CREATE POLICY "Auth users can vote" ON public.hostel_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own hostel votes" ON public.hostel_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own hostel votes" ON public.hostel_votes FOR DELETE USING (auth.uid() = user_id);

-- 3. REVIEW VOTES (helpful / not helpful)
CREATE TABLE IF NOT EXISTS public.review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(review_id, user_id)
);

ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read review votes" ON public.review_votes FOR SELECT USING (true);
CREATE POLICY "Auth insert review votes" ON public.review_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth update review votes" ON public.review_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Auth delete review votes" ON public.review_votes FOR DELETE USING (auth.uid() = user_id);

-- 4. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'hostel_submitted', 'hostel_approved', 'hostel_rejected', 'vote_threshold')),
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 5. HELPER: Get vote counts for a pending hostel
CREATE OR REPLACE FUNCTION public.get_hostel_vote_counts(hostel_uuid UUID)
RETURNS TABLE(upvotes BIGINT, downvotes BIGINT) AS $$
  SELECT
    COUNT(*) FILTER (WHERE vote_type = 'upvote') AS upvotes,
    COUNT(*) FILTER (WHERE vote_type = 'downvote') AS downvotes
  FROM public.hostel_votes
  WHERE hostel_id = hostel_uuid;
$$ LANGUAGE sql STABLE;
