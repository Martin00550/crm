import { Plus_Jakarta_Sans } from "next/font/google";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/theme-provider";
import { DarkModeProvider } from "@/contexts/DarkModeContext";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { ToastContainer } from "@/hooks/use-toast";
import QueryProvider from "@/providers/QueryProvider";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RetainVault | Secure Your Book of Business",
  description: "The Executive Command Center for High-Ticket Independent Agencies. Eliminate policy leakage and automate your 90-day renewal window with AI-driven rate analysis.",
  openGraph: {
    title: "RetainVault",
    description: "The Executive Command Center for High-Ticket Independent Agencies.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RetainVault",
  },
};

export const viewport: Viewport = {
  themeColor: "#22c55e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`light ${plusJakartaSans.variable}`}>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#22c55e" />
      </head>
      <body suppressHydrationWarning className="bg-surface text-on-surface antialiased font-body">
        <Script
          src="https://cdn.paddle.com/paddle/v2/paddle.js"
          strategy="afterInteractive"
        />
        <Script
          id="register-sw"
          strategy="afterInteractive"
        >
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then((registration) => {
                    console.log('SW registered: ', registration);
                  })
                  .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
          `}
        </Script>

        <DarkModeProvider>
          <ThemeProvider>
            <QueryProvider>
              <ErrorBoundary>
                <PerformanceMonitor />
                <ToastContainer />
                {children}
              </ErrorBoundary>
            </QueryProvider>
          </ThemeProvider>
        </DarkModeProvider>
      </body>
    </html>
  );
}
