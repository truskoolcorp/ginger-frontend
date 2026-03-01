import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Chat with Ginger | Dallasite On Tour",
  description:
    "Video chat with Ginger Pelirroja, your luxury travel curator. Get personalized travel advice and save up to 65% on 5-star hotels.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
