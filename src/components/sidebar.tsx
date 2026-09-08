"use client";

import Image from "next/image";
import Link from "next/link";

function HomeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5.5 9.5V21h13V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

function SummaryIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M7 15l4-4 3 2 5-6" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function GoalsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.5 7.5 0 0 0-2.1-1.2L14.2 3h-4.4l-.3 2.7a7.5 7.5 0 0 0-2.1 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7.5 7.5 0 0 0 2.1 1.2l.3 2.7h4.4l.3-2.7a7.5 7.5 0 0 0 2.1-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
      <path d="m14 8 4 4-4 4" />
      <path d="M18 12H9" />
    </svg>
  );
}

type SidebarProps = {
  active:
    | "inicio"
    | "resumen"
    | "historial"
    | "objetivos"
    | "perfil";
  onLogout: () => void;
};

export default function Sidebar({
  active,
  onLogout,
}: SidebarProps) {
  function itemClass(
    key: SidebarProps["active"]
  ) {
    if (active === key) {
      return "flex items-center gap-3 rounded-xl bg-[#27d59b]/10 px-4 py-3 font-semibold text-[#27d59b]";
    }

    return "flex items-center gap-3 rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white";
  }

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-white/10 bg-[#0b1016] p-5 lg:block">

      {/* LOGO */}

      <Link
        href="/dashboard"
        className="flex items-center gap-3"
      >
        <Image
          src="/logo-HormiGUITA.png"
          alt="HormiGUITA"
          width={46}
          height={46}
          className="object-contain"
        />

        <span className="text-xl font-black">
          Hormi
          <span className="text-[#27d59b]">
            GUITA
          </span>
        </span>
      </Link>

      {/* NAVEGACIÓN */}

      <nav className="mt-10 space-y-2">

        <Link
          href="/dashboard"
          className={itemClass("inicio")}
        >
          <HomeIcon />
          <span>Inicio</span>
        </Link>

        <Link
          href="/dashboard/resumen"
          className={itemClass("resumen")}
        >
          <SummaryIcon />
          <span>Resumen</span>
        </Link>

        <Link
          href="/dashboard/historial"
          className={itemClass("historial")}
        >
          <HistoryIcon />
          <span>Historial</span>
        </Link>

        <Link
          href="/dashboard/objetivos"
          className={itemClass("objetivos")}
        >
          <GoalsIcon />
          <span>Objetivos</span>
        </Link>

        <Link
          href="/perfil"
          className={itemClass("perfil")}
        >
          <SettingsIcon />
          <span>Mi cuenta</span>
        </Link>

      </nav>

      {/* CERRAR SESIÓN */}

      <div className="absolute bottom-5 left-5 right-5">

        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl border border-gray-800 px-4 py-3 text-left text-gray-400 transition hover:bg-white/5 hover:text-white"
        >
          <LogoutIcon />
          <span>Cerrar sesión</span>
        </button>

      </div>

    </aside>
  );
}