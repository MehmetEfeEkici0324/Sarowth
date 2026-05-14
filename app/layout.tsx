import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
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
    default: "Sarowth | Bütçeni Koru, Fikrini Test Et",
    template: "%s | Sarowth",
  },
  description: "Sarowth, günlük birikimlerini koruyup kontrollü e-ticaret denemelerine dönüştürmen için bütçe takibi, ürün doğrulama ve sade bir çalışma alanı sunar.",
  keywords: [
    "Sarowth",
    "tasarruf ve büyüme",
    "bütçe takip uygulaması",
    "e-ticaret ürün doğrulama",
    "kişisel finans uygulaması",
    "girişim bütçe planlayıcı",
    "ürün fikri takip",
    "mikro girişim finansı",
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
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "/",
    siteName: "Sarowth",
    title: "Sarowth | Bütçeni Koru, Fikrini Test Et",
    description: "Paranı korumak, e-ticaret fikirlerini doğrulamak ve elindeki bütçeyle daha bilinçli ilerlemek için sade bir çalışma alanı.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Sarowth çalışma alanı önizlemesi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sarowth | Bütçeni Koru, Fikrini Test Et",
    description: "Günlük birikimlerini Sarowth ile kontrollü e-ticaret denemelerine dönüştür.",
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
    <html lang="tr">
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
              description: "Sarowth, günlük birikimlerini koruyup kontrollü e-ticaret denemelerine dönüştürmen için bütçe takibi, ürün doğrulama ve sade bir çalışma alanı sunar.",
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
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
