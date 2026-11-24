import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Urban Air – Science-Backed Air Quality Assistant",
  description:
    "Real-time US EPA AQI tracking, personalized persona guidance, routine planner, indoor air mitigation, health impact calculations, and community alerts.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
