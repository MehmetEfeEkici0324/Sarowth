import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

interface RootLayoutProps {
  children: React.ReactNode;
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarowth.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sarowth | Budget Smarter, Build Leaner",
    template: "%s | Sarowth",
  },
  description: "Sarowth helps people turn everyday savings into careful ecommerce experiments with budget tracking, product validation and a clear growth workspace.",
  keywords: [
    "Sarowth",
    "Save and Growth",
    "budget tracker",
    "ecommerce validation",
    "personal finance app",
    "startup budget planner",
    "product idea tracker",
    "micro business finance",
  ],
  authors: [{ name: "Sarowth" }],
  creator: "Sarowth",
  publisher: "Sarowth",
  applicationName: "Sarowth",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Sarowth",
    title: "Sarowth | Budget Smarter, Build Leaner",
    description: "A calm workspace for protecting cash, validating ecommerce ideas and building from the money you already have.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Sarowth workspace preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sarowth | Budget Smarter, Build Leaner",
    description: "Turn everyday savings into careful ecommerce experiments with Sarowth.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "finance",
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Sarowth",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              url: siteUrl,
              description: "Sarowth helps people turn everyday savings into careful ecommerce experiments with budget tracking, product validation and a clear growth workspace.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              brand: {
                "@type": "Brand",
                name: "Sarowth",
              },
            }),
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
