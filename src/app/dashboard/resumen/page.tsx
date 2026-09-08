"use client";

import Sidebar from "@/components/sidebar";
import Link from "next/link";

export default function ResumenPage() {
  function logout() {
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-[#080a0d] text-white">

      <Sidebar
        active="resumen"
        onLogout={logout}
      />

      <section className="lg:ml-64">

        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/10 bg-[#080a0d]/90 px-6 backdrop-blur-xl lg:px-10">

          <div>
            <h1 className="text-xl font-bold">
              Resumen
            </h1>

            <p className="text-sm text-gray-500">
              Análisis de tus finanzas
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
                <path d="M4 19V5" />
                <path d="M4 19h16" />
                <path d="M7 15l4-4 3 2 5-6" />
              </svg>
            </div>

            <h2 className="mt-6 text-3xl font-black">
              Resumen financiero
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-gray-500">
              Acá vamos a concentrar el análisis detallado de
              tus ingresos, gastos, evolución y períodos.
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