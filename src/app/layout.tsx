import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WCC Participações | Gestão Integrada de Apontamentos BIM 2026",
  description: "Plataforma oficial da WCC Participações para gestão de apontamentos, compatibilização multidisciplinar de projetos e relatórios executivos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col md:flex-row font-sans bg-slate-50 dark:bg-[#041A24] text-[#072B3B] dark:text-slate-100 transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Navigation />
          <div className="flex-1 w-full min-w-0">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
