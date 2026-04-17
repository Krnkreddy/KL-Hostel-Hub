# 🏠 KL Hostel Hub

**Trusted hostel reviews by verified KL University students.**

A production-ready, student-only hostel review platform built for KL University Vijayawada. Only verified `@kluniversity.in` students can sign in, browse hostels, and submit reviews.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Auth:** Microsoft Azure AD OAuth (single-tenant, @kluniversity.in only)
- **Styling:** CSS Modules with glassmorphism dark theme
- **Deployment:** Vercel

## Features

- 🔒 Microsoft OAuth with @kluniversity.in domain restriction
- 🏠 Hostel browsing with search, filter, and sort
- ⭐ 7-category star ratings (cleanliness, food, WiFi, safety, value, management)
- 📷 Review image upload with magic-byte validation
- 🚩 Review flagging system for moderation
- 👨‍💼 Admin dashboard with stats and flagged reviews
- 🛡️ Row Level Security on all tables
- 🔍 Input sanitization against PostgREST injection

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase project
- Azure AD app registration

### Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local
# Fill in your Supabase URL, keys, and app URL

# Run the dev server
npm run dev
```

### Database Setup

1. Go to your Supabase project → SQL Editor
2. Run `supabase/schema.sql` to create tables, RLS policies, and functions
3. Run `supabase/seed.sql` to insert sample hostels
4. Create Storage buckets: `review-images` (public) and `hostel-images` (public)

### Azure AD Setup

1. Go to [Azure Portal](https://portal.azure.com) → Microsoft Entra ID → App Registrations
2. Register a new app (Single tenant)
3. Add redirect URI: `https://<YOUR_SUPABASE_PROJECT>.supabase.co/auth/v1/callback`
4. Create a client secret
5. Configure in Supabase Dashboard → Auth → Providers → Azure

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Krnkreddy/KL-Hostel-Hub)

### Environment Variables (set in Vercel dashboard)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_APP_URL` | Your production URL (e.g. `https://kl-hostel-hub.vercel.app`) |

### Post-Deployment Checklist

- [ ] Add production URL to Azure AD redirect URIs
- [ ] Update Supabase Auth → URL Configuration → Site URL
- [ ] Set at least one user's `role` to `admin` in profiles table
- [ ] Test full flow: Login → Browse → Write Review → Upload Images → Flag

## Project Structure

```
src/
├── app/
│   ├── api/          # REST API routes (hostels, reviews, upload, flag)
│   ├── auth/         # OAuth callback & signout
│   ├── dashboard/    # Admin dashboard
│   ├── hostels/      # Listing, detail, review submission
│   ├── login/        # Microsoft OAuth login
│   └── profile/      # User profile
├── components/       # Header, Footer, HostelCard, ReviewCard, StarRating
├── hooks/            # useAuth
├── lib/              # Supabase clients, auth, validation, formatting
└── types/            # TypeScript definitions
```

## Security

- Triple-layered domain restriction (Azure AD tenant + DB trigger + app-level check)
- Row Level Security on all 6 tables
- PostgREST filter injection prevention
- Open redirect protection on auth callback
- Magic byte file validation (prevents SVG/XSS uploads)
- Rating value bounds checking (1-5 integers)
- Hostel payload whitelist sanitization
- Pagination limit clamping

## License

MIT
