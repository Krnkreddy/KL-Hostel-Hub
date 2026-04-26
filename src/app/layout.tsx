import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "KL Hostel Hub — Honest Hostel Reviews for KL University", template: "%s | KL Hostel Hub" },
  description: "Find the best hostels near KL University. Honest reviews, ratings & photos by verified KLU students. Compare prices, amenities & safety — make the right choice.",
  keywords: ["KL University hostels", "KLU hostel reviews", "hostels near KL University", "Vaddeswaram hostels", "KL hostel ratings", "best hostel KLU", "KL University PG", "student hostels Guntur"],
  authors: [{ name: "KL Hostel Hub" }],
  metadataBase: new URL("https://klhostelhub.vercel.app"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "KL Hostel Hub",
    title: "KL Hostel Hub — Honest Hostel Reviews by KLU Students",
    description: "Compare hostels near KL University with real student reviews, ratings & photos. Find your perfect hostel today.",
    url: "https://klhostelhub.vercel.app",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "KL Hostel Hub — Hostel Reviews for KL University Students",
    description: "Real reviews by verified KLU students. Compare prices, safety, food & more.",
  },
  robots: { index: true, follow: true },
  verification: { google: "googlec2db332bff7e6b50" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
