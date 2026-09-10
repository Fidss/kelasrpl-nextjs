import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "10 RPL - SMK Negeri 17 Jakarta",
  description:
    "Website resmi kelas 10 Rekayasa Perangkat Lunak SMK Negeri 17 Jakarta. Direktori siswa, jadwal pelajaran, AI Assistant Elostra, Menfess, dan Absensi.",
  icons: {
    icon: "/favicon.ico",
  },
};

import { Suspense } from "react";
import NavigationProgressBar from "@/components/common/NavigationProgressBar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${outfit.variable} scroll-smooth`} suppressHydrationWarning>
      <body
        className="bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 antialiased font-sans selection:bg-accent-500 selection:text-white min-h-screen flex flex-col"
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme');
                  var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}

                window.toggleTheme = function() {
                  var isDark = document.documentElement.classList.contains('dark');
                  if (isDark) {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('theme', 'light');
                  } else {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('theme', 'dark');
                  }
                  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { isDark: !isDark } }));
                };
              })();
            `,
          }}
        />
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
