"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DateRangeProvider, useDateRange } from "./DateRangeContext";
import DateRangePicker from "./DateRangePicker";
import ChatPanel from "./ChatPanel";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Resumen", icon: "▦" },
  { href: "/campanas", label: "Campañas", icon: "◎" },
  { href: "/rentabilidad", label: "Rentabilidad", icon: "$" },
  { href: "/embudo", label: "Embudo", icon: "▽" },
  { href: "/asistente", label: "Asistente IA", icon: "✦" },
];

function ChatDrawer() {
  const [abierto, setAbierto] = useState(false);
  const { from, to } = useDateRange();
  const pathname = usePathname();
  // En la sección dedicada el chat ya está a pantalla completa: no mostramos el botón flotante
  if (pathname === "/asistente") return null;
  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className={`fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-brand-700 ${
          abierto ? "hidden" : ""
        }`}
      >
        ✦ Asistente IA
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-40 bg-ink-900/30" onClick={() => setAbierto(false)} />
          <div className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-md p-3">
            <div className="relative h-full">
              <button
                onClick={() => setAbierto(false)}
                className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-ink-700 dark:hover:text-slate-200"
                aria-label="Cerrar asistente"
              >
                ✕
              </button>
              <ChatPanel from={from} to={to} />
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-52 flex-col bg-ink-900 md:flex">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 font-display text-lg font-bold text-white">
          C
        </span>
        <div>
          <p className="font-display text-base font-semibold leading-tight text-white">CaptaMed</p>
          <p className="text-[10px] leading-tight text-slate-400">Campañas + CRM</p>
        </div>
      </div>
      <nav className="mt-2 flex-1 space-y-1 px-2.5">
        {NAV.map((item) => {
          const activo = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                activo ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-ink-700 hover:text-white"
              }`}
            >
              <span className="w-4 text-center text-xs opacity-80">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p className="px-4 py-3 text-[10px] text-slate-500">CaptaMed · Growth para clínicas</p>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-30 flex gap-1 overflow-x-auto border-b border-ink-700 bg-ink-900 px-3 py-2 md:hidden">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${
            pathname === item.href ? "bg-brand-600 text-white" : "text-slate-300"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <DateRangeProvider>
      <Sidebar />
      <div className="md:pl-52">
        <MobileNav />
        <header className="border-b border-slate-200 bg-ink-800">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="text-xs text-slate-300">Período analizado</p>
            <div className="flex items-center gap-2">
              <DateRangePicker />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6">{children}</main>
      </div>
      <ChatDrawer />
    </DateRangeProvider>
  );
}
