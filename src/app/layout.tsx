import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "KL Hostel Hub", template: "%s | KL Hostel Hub" },
  description: "Trusted hostel reviews by verified KL University students.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
