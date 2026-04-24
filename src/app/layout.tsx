import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import GoogleAnalytics from "@/components/GoogleAnalytics";
import DataDiveFeedback from "@/components/DataDiveFeedback";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "disordat — compare anything, share the verdict",
  description:
    "Enter two things. Get an honest side-by-side comparison with a winner. Every comparison gets its own shareable page — paste the link anywhere.",
  keywords:
    "compare, comparison, versus, vs, decision, side by side, which is better, product comparison",
  authors: [{ name: "disordat" }],
  creator: "disordat",
  publisher: "disordat",
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  metadataBase: new URL("https://disordat.org"),
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "disordat — compare anything, share the verdict",
    description:
      "Enter two things. Get an honest side-by-side comparison with a winner. Share the link anywhere.",
    url: "https://disordat.org",
    siteName: "disordat",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "disordat — compare anything, share the verdict",
    description:
      "Enter two things. Get an honest side-by-side comparison with a winner. Share the link anywhere."
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
    google: "oMNG-WDMNjLziDAovGUtgfrQxBJ7FrZHiJoXWF_37w8"
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
              name: "disordat",
              description:
                "Compare any two things side by side and share the verdict with a link.",
              url: "https://disordat.org",
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD"
              },
              author: {
                "@type": "Organization",
                name: "disordat"
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <GoogleAnalytics />
        {children}
        <DataDiveFeedback siteSlug="disordat" accentColor="#10b981" />
      </body>
    </html>
  );
}

