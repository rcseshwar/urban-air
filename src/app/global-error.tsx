"use client";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body style={{ background: "#0b1120", color: "#f9fafb", fontFamily: "sans-serif", padding: "3rem 1rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.8rem", color: "#f87171", marginBottom: "1rem" }}>
          Critical Application Error
        </h1>
        <p style={{ color: "#94a3b8", maxWidth: "500px", margin: "0 auto 1.5rem auto" }}>
          A root layout error occurred. Please refresh or retry.
        </p>
        <button
          type="button"
          style={{
            background: "#026aa2",
            color: "#fff",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: "pointer",
          }}
          onClick={() => reset()}
        >
          Recover Application
        </button>
      </body>
    </html>
  );
}
