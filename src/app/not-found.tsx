import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container" style={{ padding: "5rem 1rem", textAlign: "center" }}>
      <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }} aria-hidden="true">
        🌍
      </div>
      <h2 style={{ fontSize: "2rem", color: "#f1f5f9", marginBottom: "0.5rem" }}>
        404 – Location or Page Not Found
      </h2>
      <p style={{ color: "var(--text-muted)", maxWidth: "480px", margin: "0 auto 1.5rem auto" }}>
        The requested atmospheric view or page does not exist. Return to the main air quality defense dashboard.
      </p>
      <Link href="/" className="geo-btn" style={{ textDecoration: "none", display: "inline-block" }}>
        Return to Urban Air Dashboard
      </Link>
    </div>
  );
}
