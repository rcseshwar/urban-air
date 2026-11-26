export default function Loading() {
  return (
    <div className="container" role="status" aria-live="polite" style={{ padding: "4rem 1rem", textAlign: "center" }}>
      <div style={{ display: "inline-block", fontSize: "2.5rem", marginBottom: "1rem" }} aria-hidden="true">
        🍃
      </div>
      <h2 style={{ fontSize: "1.25rem", color: "#f1f5f9", marginBottom: "0.5rem" }}>
        Loading Urban Air Quality Assistant...
      </h2>
      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
        Syncing real-time environmental telemetry and atmospheric models.
      </p>
    </div>
  );
}
