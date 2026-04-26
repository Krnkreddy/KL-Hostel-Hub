# 🏠 KL Hostel Hub

**Trusted hostel reviews by verified KL University students.**

🔗 Live: https://klhostelhub.vercel.app/

KL Hostel Hub is a production-ready platform where **KL University Vijayawada students** can discover, review, and evaluate hostels with real, community-driven insights.

---

## 🚀 Features

- 🔒 Microsoft OAuth (Azure AD) — **@kluniversity.in only access**
- 🏠 Browse hostels with **search, filters, and sorting**
- ⭐ **7-category rating system** (cleanliness, food, WiFi, safety, value, management)
- 📷 Image uploads with **secure validation (magic byte check)**
- 🚩 Review flagging & moderation system
- 👍 Review voting (helpful / not helpful)
- 🧑‍💼 Admin dashboard with moderation tools
- 🏗️ User-submitted hostels with approval workflow *(in progress / optional)*
- 🛡️ Full **Row Level Security (RLS)** on all tables
- ⚡ Optimized queries, SSR, and scalable architecture

---

## 🧱 Tech Stack

- **Frontend:** Next.js 16 (App Router, SSR, Turbopack)
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Authentication:** Microsoft Azure AD OAuth
- **Styling:** CSS Modules (Glassmorphism Dark UI)
- **Deployment:** Vercel

---

## 🔐 Security Highlights

- Triple-layered domain restriction:
  - Azure AD tenant
  - Database trigger validation
  - App-level verification
- RLS enforced on all tables
- Input sanitization (PostgREST injection protection)
- Secure file uploads (MIME + magic byte validation)
- Open redirect protection
- Strict validation on ratings and payloads

---

## ⚙️ Getting Started

### 📌 Prerequisites
- Node.js 18+
- Supabase project
- Azure AD app registration

---

### 💻 Local Development

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local

# Run development server
npm run dev
````

---

### 🗄️ Database Setup

1. Open Supabase → SQL Editor
2. Run:

```bash
supabase/schema.sql
```

3. Seed data:

```bash
supabase/seed.sql
```

4. Create storage buckets:

* `review-images` (public)
* `hostel-images` (public)

---

### 🔑 Azure AD Setup

1. Go to Azure Portal → Microsoft Entra ID
2. Create App Registration
3. Set redirect URI:

```
https://<YOUR_SUPABASE_PROJECT>.supabase.co/auth/v1/callback
```

4. Generate client secret
5. Configure in Supabase → Auth → Providers → Azure

---

## 🌐 Deployment (Vercel)

Deploy easily using:

👉 [https://vercel.com/new/clone?repository-url=https://github.com/Krnkreddy/KL-Hostel-Hub](https://vercel.com/new/clone?repository-url=https://github.com/Krnkreddy/KL-Hostel-Hub)

---

### 🔧 Environment Variables

| Variable                        | Description            |
| ------------------------------- | ---------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key         |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-only secret key |
| `NEXT_PUBLIC_APP_URL`           | Production URL         |

---

### ✅ Post-Deployment Checklist

* [ ] Add Vercel URL to Azure redirect URIs
* [ ] Update Supabase Auth → Site URL
* [ ] Set admin user in `profiles` table
* [ ] Test full flow:

  * Login
  * Browse hostels
  * Submit review
  * Upload images
  * Vote / flag

---

## 📂 Project Structure

```
src/
├── app/
│   ├── api/          # REST API routes
│   ├── auth/         # OAuth callback & logout
│   ├── dashboard/    # Admin panel
│   ├── hostels/      # Listing, details, reviews
│   ├── login/        # Auth UI
│   └── profile/      # User profile
├── components/       # UI components
├── hooks/            # Custom hooks
├── lib/              # Supabase + utils
└── types/            # TypeScript types
```

---

## 🎯 Vision

KL Hostel Hub aims to become a **trusted, student-driven ecosystem** where:

* Students help students choose better hostels
* Data is verified through community feedback
* Decisions are based on real experiences

---

## 📜 License

MIT
