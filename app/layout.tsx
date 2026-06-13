import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/app/providers";

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground transition-colors duration-300 antialiased font-sans">
        {/* 전역 배경 오로라 그라데이션 데코레이션 */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none dark:hidden">
          {/* 상단 왼쪽에 은은한 Indigo/Purple 그라데이션 원 */}
          <div className="absolute -top-[30%] -left-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-indigo-200/40 to-purple-200/40 dark:from-indigo-950/25 dark:to-purple-950/15 blur-[130px] animate-pulse duration-[8000ms]" />
          {/* 하단 오른쪽에 은은한 Pink/Emerald 그라데이션 원 */}
          <div className="absolute -bottom-[30%] -right-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-pink-200/30 to-emerald-200/30 dark:from-pink-950/15 dark:to-emerald-950/10 blur-[130px] animate-pulse duration-[10000ms]" />
        </div>
        <ThemeProvider>
          <Providers>
            <Header />
            <main>{children}</main>
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}

