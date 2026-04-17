"use client";
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html><body style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f", color: "#e2e8f0", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 480, padding: "2rem" }}>
        <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>💥</p>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>Something went wrong</h2>
        <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>An unexpected error occurred.</p>
        <button onClick={() => reset()} style={{ padding: "0.75rem 2rem", background: "#0078D4", color: "white", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 600 }}>Try Again</button>
      </div>
    </body></html>
  );
}
