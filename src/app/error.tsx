"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected client exceptions
    console.error("Urban Air application error:", error);
  }, [error]);

  return (
    <div className="container" style={{ padding: "4rem 1rem", textAlign: "center" }} role="alert">
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }} aria-hidden="true">
        ⚠️
      </div>
      <h2 style={{ color: "#f87171", fontSize: "1.5rem", marginBottom: "0.75rem" }}>
        Something went wrong
      </h2>
      <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto 1.5rem auto", fontSize: "0.95rem" }}>
        An unexpected application error occurred while rendering the air quality dashboard. Your settings and API keys remain safe.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
        <button
          type="button"
          className="geo-btn"
          onClick={() => reset()}
        >
          Try Again
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            if (typeof window !== "undefined") window.location.href = "/";
          }}
        >
          Reload Dashboard
        </button>
      </div>
    </div>
  );
}
