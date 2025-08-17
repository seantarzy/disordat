import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Dis or Dat - Let the Magic Genie Decide!",
  description:
    "A fun decision app where a magical genie compares two things and picks the winner. Enter any two items and let the genie decide what's better!",
  keywords:
    "decision app, genie, comparison, choose, pick, fun, magic, dis or dat",
  authors: [{ name: "Dis or Dat Team" }],
  creator: "Dis or Dat",
  publisher: "Dis or Dat",
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  metadataBase: new URL("https://disordat.com"),
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Dis or Dat - Let the Magic Genie Decide!",
    description:
      "A fun decision app where a magical genie compares two things and picks the winner.",
    url: "https://disordat.com",
    siteName: "Dis or Dat",
    images: [
      {
        url: "/genie-shrug.svg",
        width: 320,
        height: 320,
        alt: "Magic Genie"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Dis or Dat - Let the Magic Genie Decide!",
    description:
      "A fun decision app where a magical genie compares two things and picks the winner.",
    images: ["/genie-shrug.svg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  verification: {
    google: "your-google-verification-code"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/genie-shrug.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Dis or Dat",
              description:
                "A fun decision app where a magical genie compares two things and picks the winner",
              url: "https://disordat.com",
              applicationCategory: "EntertainmentApplication",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD"
              },
              author: {
                "@type": "Organization",
                name: "Dis or Dat Team"
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}

