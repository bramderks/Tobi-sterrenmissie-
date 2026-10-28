import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Tobi’s Voetbalmissie ⚽", description: "Scoor goede acties en verdien extra bedtijd!" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="nl"><body>{children}</body></html>; }
