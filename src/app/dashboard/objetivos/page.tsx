"use client";

import Sidebar from "@/components/sidebar";
import Link from "next/link";

export default function ObjetivosPage() {
  function logout() {
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-[#080a0d] text-white">

      <Sidebar
        active="objetivos"
        onLogout={logout}
      />

      <section className="lg:ml-64">

        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/10 bg-[#080a0d]/90 px-6 backdrop-blur-xl lg:px-10">

          <div>
            <h1 className="text-xl font-bold">
              Objetivos
            </h1>

            <p className="text-sm text-gray-500">
              Metas para tu dinero
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5"
          >
            Volver
          </Link>

        </header>

        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6 lg:p-10">

          <div className="w-full max-w-2xl rounded-3xl border border-gray-800 bg-[#111720] p-10 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#27d59b]/20 bg-[#27d59b]/10 text-[#27d59b]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="12" cy="12" r="1" />
              </svg>
            </div>

            <h2 className="mt-6 text-3xl font-black">
              Tus objetivos
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-gray-500">
              Acá vas a poder crear metas de ahorro, definir
              objetivos y seguir tu progreso.
            </p>

            <div className="mt-7 inline-flex rounded-full border border-gray-800 bg-[#0b1016] px-4 py-2 text-sm text-gray-500">
              Próximamente
            </div>

          </div>

        </div>

      </section>

    </main>
  );
}