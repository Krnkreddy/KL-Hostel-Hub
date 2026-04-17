-- KL Hostel Hub Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (auto-created via trigger on auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL, full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT, role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Domain check trigger
CREATE OR REPLACE FUNCTION public.check_klu_domain() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email NOT LIKE '%@kluniversity.in' THEN
    RAISE EXCEPTION 'Only @kluniversity.in emails are allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER enforce_klu_domain BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.check_klu_domain();

-- Hostels
CREATE TABLE public.hostels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, slug TEXT UNIQUE, description TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL, distance_from_campus NUMERIC(4,2) NOT NULL DEFAULT 0,
  price_min INTEGER NOT NULL DEFAULT 0, price_max INTEGER NOT NULL DEFAULT 0,
  gender TEXT NOT NULL DEFAULT 'co-ed' CHECK (gender IN ('male', 'female', 'co-ed')),
  amenities TEXT[] DEFAULT '{}', image_url TEXT, images TEXT[] DEFAULT '{}',
  contact_phone TEXT, contact_email TEXT, is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hostels viewable by everyone" ON public.hostels FOR SELECT USING (true);
CREATE POLICY "Admins can manage hostels" ON public.hostels FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 10 AND 5000),
  stay_duration TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hostel_id, user_id)
);
CREATE INDEX idx_reviews_hostel ON public.reviews(hostel_id);
CREATE INDEX idx_reviews_user ON public.reviews(user_id);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Ratings
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE UNIQUE,
  overall INTEGER NOT NULL CHECK (overall BETWEEN 1 AND 5),
  cleanliness INTEGER NOT NULL CHECK (cleanliness BETWEEN 1 AND 5),
  food_quality INTEGER NOT NULL CHECK (food_quality BETWEEN 1 AND 5),
  wifi_quality INTEGER NOT NULL CHECK (wifi_quality BETWEEN 1 AND 5),
  safety INTEGER NOT NULL CHECK (safety BETWEEN 1 AND 5),
  value_for_money INTEGER NOT NULL CHECK (value_for_money BETWEEN 1 AND 5),
  management INTEGER NOT NULL CHECK (management BETWEEN 1 AND 5)
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings viewable by everyone" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert ratings for own reviews" ON public.ratings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.reviews WHERE id = review_id AND user_id = auth.uid())
);

-- Review Images
CREATE TABLE public.review_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Images viewable by everyone" ON public.review_images FOR SELECT USING (true);
CREATE POLICY "Users can insert images for own reviews" ON public.review_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.reviews WHERE id = review_id AND user_id = auth.uid())
);

-- Review Flags
CREATE TABLE public.review_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 5 AND 500),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(review_id, user_id)
);
ALTER TABLE public.review_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view flags" ON public.review_flags FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Authenticated users can flag" ON public.review_flags FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Aggregate ratings function
CREATE OR REPLACE FUNCTION public.get_hostel_ratings(hostel_uuid UUID)
RETURNS TABLE (
  total_reviews BIGINT, average_overall NUMERIC, average_cleanliness NUMERIC,
  average_food_quality NUMERIC, average_wifi_quality NUMERIC, average_safety NUMERIC,
  average_value_for_money NUMERIC, average_management NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(r.id), ROUND(AVG(rt.overall)::numeric, 1), ROUND(AVG(rt.cleanliness)::numeric, 1),
    ROUND(AVG(rt.food_quality)::numeric, 1), ROUND(AVG(rt.wifi_quality)::numeric, 1),
    ROUND(AVG(rt.safety)::numeric, 1), ROUND(AVG(rt.value_for_money)::numeric, 1),
    ROUND(AVG(rt.management)::numeric, 1)
  FROM public.reviews r JOIN public.ratings rt ON rt.review_id = r.id
  WHERE r.hostel_id = hostel_uuid;
END;
$$ LANGUAGE plpgsql;
