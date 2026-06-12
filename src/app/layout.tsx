import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CaptaMed — Campañas + CRM para clínicas",
  description:
    "Dashboard ejecutivo que integra Meta Ads y el CRM de tu clínica: leads, agendamientos, asistencia y ventas, con un asistente de IA para consultar tus datos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
