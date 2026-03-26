import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/components/shared/language-provider";
import { NavigationProgress } from "@/components/shared/navigation-progress";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "ResuLift — Optimiseur de CV ATS",
    template: "%s — ResuLift",
  },
  description: "Analysez votre CV contre n'importe quelle offre d'emploi. Obtenez un score ATS, une analyse de mots-clés et des recommandations concrètes pour décrocher plus d'entretiens.",
  keywords: ["optimiseur CV", "ATS", "candidature", "analyse CV", "carrière", "résumé", "score ATS"],
  metadataBase: new URL("https://resulift.cv"),
  openGraph: {
    title: "ResuLift — Optimiseur de CV ATS",
    description: "Analysez votre CV contre n'importe quelle offre d'emploi et obtenez un score ATS détaillé avec des recommandations d'optimisation.",
    type: "website",
    url: "https://resulift.cv",
    siteName: "ResuLift",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResuLift — Optimiseur de CV ATS",
    description: "Analysez votre CV contre n'importe quelle offre d'emploi et obtenez un score ATS détaillé.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${bricolage.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <LanguageProvider>
          <NavigationProgress />
          {children}
          <Toaster richColors position="top-right" />
          <Analytics />
        </LanguageProvider>
      </body>
    </html>
  );
}
