import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "דפוס קשת - מערכת ניהול",
  description: "מערכת ניהול מתקדמת לבית דפוס",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "דפוס קשת",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  contentSecurityPolicy: {
    directives: {
      "script-src": [
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'",
        "www.google.com",
        "www.gstatic.com",
        "*.youtube.com",
        "*.youtube-nocookie.com",
        "*.ytimg.com",
        "*.twimg.com",
        "cdn.ampproject.org",
        "*.googleapis.com",
        "*.fides-cdn.ethyca.com",
        "*.ethyca.com",
        "cdn.ethyca.com",
        "cdn.vercel-insights.com",
        "va.vercel-scripts.com",
        "cdp.vercel.com",
        "vercel.com",
        "*.vercel.com",
        "assets.vercel.com",
        "*.vercel.sh",
        "vercel.live",
        "*.stripe.com",
        "js.stripe.com",
        "m.stripe.network",
        "twitter.com",
        "*.twitter.com",
        "*.google.com",
        "*.github.com",
        "*.codesandbox.io",
        "https://risk.clearbit.com",
        "wss://*.vercel.com",
        "localhost:*",
        "chrome-extension://*",
        "blob:",
      ],
      "style-src": [
        "'self'",
        "'unsafe-inline'",
        "https://m.stripe.network",
        "*.googleapis.com",
        "*.twitter.com",
      ],
      "connect-src": [
        "'self'",
        "*.stripe.com",
        "api.stripe.com",
        "js.stripe.com",
        "m.stripe.network",
        "vercel.com",
        "*.vercel.com",
      ],
      "img-src": [
        "'self'",
        "data:",
        "blob:",
        "*.stripe.com",
        "*.vercel.com",
      ],
      "font-src": ["'self'", "data:"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
      "upgrade-insecure-requests": [],
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
