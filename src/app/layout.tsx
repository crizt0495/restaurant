import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Space_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "react-hot-toast"
import { PwaRegistration } from "@/components/pwa-registration"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
})

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "RMS - Sistem Manajemen Restoran",
  description: "Sistem manajemen restoran profesional - POS, pesanan, layar dapur, inventaris, dan laporan.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RMS",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={`${plusJakarta.variable} ${spaceMono.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#e64a19" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster
            position="top-right"
            gutter={10}
            toastOptions={{
              className:
                "!bg-card !text-card-foreground !border !border-border !shadow-lg !text-sm !font-medium",
              style: {
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
              },
              success: { iconTheme: { primary: "hsl(var(--success))", secondary: "hsl(var(--success-foreground))" } },
              error: {
                iconTheme: { primary: "hsl(var(--destructive))", secondary: "hsl(var(--destructive-foreground))" },
              },
            }}
          />
          <PwaRegistration />
        </ThemeProvider>
      </body>
    </html>
  )
}