export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: "student" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Hostel {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  distance_from_campus: number;
  price_min: number;
  price_max: number;
  gender: "male" | "female" | "co-ed";
  amenities: string[];
  image_url: string | null;
  images: string[];
  contact_phone: string | null;
  contact_email: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  average_rating?: number | null;
  review_count?: number;
}

export interface Review {
  id: string;
  hostel_id: string;
  user_id: string;
  title: string;
  content: string;
  stay_duration: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  rating?: Rating;
  ratings?: Rating[];
  images?: ReviewImage[];
}

export interface Rating {
  id: string;
  review_id: string;
  overall: number;
  cleanliness: number;
  food_quality: number;
  wifi_quality: number;
  safety: number;
  value_for_money: number;
  management: number;
}

export interface ReviewImage {
  id: string;
  review_id: string;
  image_url: string;
}

export interface AggregateRating {
  total_reviews: number;
  average_overall: number;
  average_cleanliness: number;
  average_food_quality: number;
  average_wifi_quality: number;
  average_safety: number;
  average_value_for_money: number;
  average_management: number;
}

export interface ReviewFormData {
  title: string;
  content: string;
  stay_duration: string;
  overall: number;
  cleanliness: number;
  food_quality: number;
  wifi_quality: number;
  safety: number;
  value_for_money: number;
  management: number;
  images: File[];
}

export const RATING_CATEGORIES = [
  { key: "overall", label: "Overall", icon: "⭐" },
  { key: "cleanliness", label: "Cleanliness", icon: "🧹" },
  { key: "food_quality", label: "Food Quality", icon: "🍽️" },
  { key: "wifi_quality", label: "WiFi", icon: "📶" },
  { key: "safety", label: "Safety", icon: "🔒" },
  { key: "value_for_money", label: "Value for Money", icon: "💰" },
  { key: "management", label: "Management", icon: "👥" },
] as const;
