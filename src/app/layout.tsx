import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "4HR Platform",
  description: "The 4HR Transformation System coaching platform.",
  robots: { index: false, follow: false }, // private app — never index
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{ variables: { colorPrimary: "#c46a2d" } }}
    >
      <html lang="en" className="antialiased">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
