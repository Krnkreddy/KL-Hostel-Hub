import Link from "next/link";
export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <p style={{ fontSize: "4rem", marginBottom: "1rem" }}>🏚️</p>
        <h1 style={{ fontSize: "4rem", fontWeight: 800, background: "linear-gradient(135deg, #0078D4, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1, marginBottom: "1rem" }}>404</h1>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Page Not Found</h2>
        <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/hostels" className="btn btn-primary btn-lg">Browse Hostels</Link>
      </div>
    </div>
  );
}
