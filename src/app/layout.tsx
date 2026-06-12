import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "CaptaMed — Campañas + CRM para clínicas",
  description:
    "Dashboard ejecutivo que integra Meta Ads, Google Ads y el CRM de tu clínica: leads, agendamientos, asistencia, rentabilidad y ventas, con un asistente de IA para consultar tus datos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
