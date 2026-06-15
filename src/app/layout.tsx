import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "CaptaMed — Campañas + CRM para clínicas",
  description:
    "Dashboard ejecutivo que integra Meta Ads, Google Ads y el CRM de tu clínica: leads, agendamientos, asistencia, rentabilidad y ventas, con un asistente de IA para consultar tus datos.",
};

// Aplica el tema guardado antes del primer paint para evitar parpadeo
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
