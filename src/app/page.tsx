"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#080a0d] text-white">

      {/* =========================
          NAVBAR
      ========================== */}

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080a0d]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">

          {/* LOGO */}

          <a
            href="#inicio"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3"
          >
            <Image
              src="/logo-HormiGUITA.png"
              alt="Logo HormiGUITA"
              width={52}
              height={52}
              priority
              className="object-contain"
            />

            <span className="text-2xl font-black tracking-tight">
              Hormi
              <span className="text-[#27d59b]">
                GUITA
              </span>
            </span>
          </a>

          {/* MENU DESKTOP */}

          <nav className="hidden items-center gap-8 md:flex">

            <a
              href="#conoce"
              className="text-sm font-medium text-gray-400 transition hover:text-white"
            >
              Conocé HormiGUITA
            </a>

            <a
              href="#inicio"
              className="text-sm font-medium text-gray-400 transition hover:text-white"
            >
              Inicio
            </a>

            <a
              href="#panel"
              className="text-sm font-medium text-gray-400 transition hover:text-white"
            >
              Panel de Control
            </a>

            <a
              href="#cuenta"
              className="text-sm font-medium text-gray-400 transition hover:text-white"
            >
              Mi Cuenta
            </a>

            <a
              href="#pro"
              className="text-sm font-bold text-purple-300 transition hover:text-purple-200"
            >
              Pro
            </a>

          </nav>

          {/* DERECHA */}

          <div className="flex items-center gap-3">

            <Link
              href="/login"
              className="hidden rounded-lg bg-gradient-to-r from-[#27d59b] to-[#16b78a] px-5 py-3 text-sm font-bold text-[#032119] shadow-lg shadow-[#16b78a]/20 transition hover:brightness-110 sm:block"
            >
              Iniciar Sesión
            </Link>

            {/* HAMBURGUESA MOBILE */}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-800 bg-[#11161d] text-xl text-gray-300 transition hover:bg-[#171d25] md:hidden"
              aria-label="Abrir menú"
            >
              {menuOpen ? "✕" : "☰"}
            </button>

          </div>

        </div>

        {/* =========================
            MENU MOBILE
        ========================== */}

        {menuOpen && (
          <div className="border-t border-white/10 bg-black md:hidden">

            <div className="flex flex-col px-6">

              {/* CONOCÉ */}

              <a
                href="#conoce"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between border-b border-white/5 py-5 text-base font-semibold text-gray-300 transition hover:text-white"
              >
                <span>Conocé HormiGUITA</span>
                <span className="text-gray-500">⌄</span>
              </a>

              {/* INICIO */}

              <a
                href="#inicio"
                onClick={() => setMenuOpen(false)}
                className="border-b border-white/5 py-5 text-base font-semibold text-gray-300 transition hover:text-white"
              >
                Inicio
              </a>

              {/* PANEL */}

              <a
                href="#panel"
                onClick={() => setMenuOpen(false)}
                className="border-b border-white/5 py-5 text-base font-semibold text-gray-300 transition hover:text-white"
              >
                Panel de Control
              </a>

              {/* CUENTA */}

              <a
                href="#cuenta"
                onClick={() => setMenuOpen(false)}
                className="border-b border-white/5 py-5 text-base font-semibold text-gray-300 transition hover:text-white"
              >
                Mi Cuenta
              </a>

              {/* PRO */}

              <a
                href="#pro"
                onClick={() => setMenuOpen(false)}
                className="border-b border-white/5 py-5 text-base font-bold text-purple-300 transition hover:text-purple-200"
              >
                Pro
              </a>

              {/* INICIAR SESIÓN */}

              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="border-b border-white/5 py-5 text-base font-bold text-[#27d59b] transition hover:text-[#68e8bc]"
              >
                Iniciar Sesión
              </Link>

              {/* EMPEZAR AHORA */}

              <Link
                href="/registro"
                onClick={() => setMenuOpen(false)}
                className="my-5 rounded-xl bg-gradient-to-r from-[#27d59b] to-[#16b78a] px-6 py-4 text-center font-extrabold text-[#032119] shadow-lg shadow-[#16b78a]/20 transition hover:brightness-110"
              >
                Empezar ahora 🐜
              </Link>

            </div>

          </div>
        )}
      </header>

      {/* =========================
          HERO
      ========================== */}

      <section
        id="inicio"
        className="relative overflow-hidden"
      >

        {/* Glow */}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_5%,rgba(39,213,155,.14),transparent_30%)]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:px-10">

          {/* TEXTO */}

          <div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#27d59b]/20 bg-[#27d59b]/10 px-4 py-2 text-sm text-[#bff8df]">
              <span className="h-2 w-2 rounded-full bg-[#27d59b]" />
              Cada pequeño movimiento cuenta
            </div>

            <h1 className="text-5xl font-black leading-[0.95] tracking-[-3px] sm:text-6xl lg:text-7xl">

              Controlá tu dinero.

              <br />

              <span className="text-[#27d59b]">
                Construí tu GUITA.
              </span>

            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-gray-400">
              HormiGUITA te ayuda a registrar ingresos y gastos,
              organizar tu plata y entender mejor tus finanzas.
            </p>

            {/* BOTONES */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">

              <Link
                href="/registro"
                className="rounded-xl bg-gradient-to-r from-[#27d59b] to-[#16b78a] px-7 py-4 text-center font-extrabold text-[#032119] shadow-lg shadow-[#16b78a]/20 transition hover:scale-[1.01] hover:brightness-110"
              >
                Empezar ahora 🐜
              </Link>

              <a
                href="#conoce"
                className="rounded-xl border border-gray-700 px-7 py-4 text-center font-bold text-white transition hover:bg-white/5"
              >
                Conocé HormiGUITA
              </a>

            </div>

            {/* BENEFICIOS */}

            <div className="mt-10 grid gap-5 sm:grid-cols-3">

              <div>
                <div className="font-bold">
                  🎙️ Audio
                </div>

                <div className="mt-1 text-sm text-gray-500">
                  Registrá tus movimientos
                </div>
              </div>

              <div>
                <div className="font-bold">
                  📊 Control
                </div>

                <div className="mt-1 text-sm text-gray-500">
                  Todo en un solo lugar
                </div>
              </div>

              <div>
                <div className="font-bold">
                  🔒 Seguridad
                </div>

                <div className="mt-1 text-sm text-gray-500">
                  Tu información es privada
                </div>
              </div>

            </div>

          </div>

          {/* PREVIEW */}

          <div className="rounded-3xl border border-gray-800 bg-gradient-to-br from-[#151e29] to-[#0d1218] p-6 shadow-2xl shadow-black/40">

            <div className="mb-6 flex items-center justify-between">

              <div>

                <div className="text-xs tracking-[3px] text-gray-500">
                  HORMIGUITA
                </div>

                <div className="mt-1 text-xl font-bold">
                  Tu dinero, de un vistazo
                </div>

              </div>

              <span className="text-sm text-[#27d59b]">
                ● En orden
              </span>

            </div>

            {/* METRICAS */}

            <div className="grid grid-cols-2 gap-3">

              <div className="rounded-2xl border border-gray-800 bg-[#0d131a] p-5">

                <div className="text-sm text-gray-500">
                  Balance actual
                </div>

                <div className="mt-2 text-2xl font-bold">
                  $125.430
                </div>

              </div>

              <div className="rounded-2xl border border-gray-800 bg-[#0d131a] p-5">

                <div className="text-sm text-gray-500">
                  Ingresos
                </div>

                <div className="mt-2 text-2xl font-bold text-[#27d59b]">
                  $380.000
                </div>

              </div>

            </div>

            {/* ACTIVIDAD */}

            <div className="mt-4 rounded-2xl border border-gray-800 bg-[#0d131a] p-4">

              <div className="flex justify-between border-b border-white/5 py-4 text-sm">
                <span>
                  🎙️ Gasté $12.000 en comida
                </span>

                <strong className="text-red-400">
                  -$12.000
                </strong>
              </div>

              <div className="flex justify-between border-b border-white/5 py-4 text-sm">
                <span>
                  💬 Cobré un trabajo
                </span>

                <strong className="text-[#27d59b]">
                  +$250.000
                </strong>
              </div>

              <div className="flex justify-between py-4 text-sm">
                <span>
                  🎙️ Pagué internet
                </span>

                <strong className="text-red-400">
                  -$18.500
                </strong>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =========================
          CONOCÉ HORMIGUITA
      ========================== */}

      <section
        id="conoce"
        className="border-t border-white/5 px-6 py-24 lg:px-10"
      >

        <div className="mx-auto max-w-7xl">

          <div className="max-w-3xl">

            <div className="text-sm font-bold uppercase tracking-[3px] text-[#27d59b]">
              Conocé HormiGUITA
            </div>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Simple, clara y pensada para el día a día.
            </h2>

            <p className="mt-5 text-lg leading-8 text-gray-400">
              La idea de HormiGUITA es que llevar tus finanzas no
              sea una tarea pesada. Registrá cada movimiento y
              entendé qué está pasando con tu plata.
            </p>

          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">

            <Feature
              icon="💸"
              title="Ingresos y Egresos"
              text="Registrá todo lo que entra y sale."
            />

            <Feature
              icon="📋"
              title="Historial completo"
              text="Sabé cuándo y cómo registraste cada movimiento."
            />

            <Feature
              icon="🐜"
              title="Pequeños pasos"
              text="Pequeños movimientos construyen grandes resultados."
            />

          </div>

        </div>

      </section>

      {/* =========================
          PANEL
      ========================== */}

      <section
        id="panel"
        className="border-t border-white/5 bg-[#0b1016] px-6 py-24 lg:px-10"
      >

        <div className="mx-auto max-w-7xl">

          <div className="max-w-3xl">

            <div className="text-sm font-bold uppercase tracking-[3px] text-[#27d59b]">
              Panel de Control
            </div>

            <h2 className="mt-4 text-4xl font-black sm:text-5xl">
              Tu información, en un solo lugar.
            </h2>

            <p className="mt-5 text-gray-400">
              Desde tu panel vas a poder consultar balances,
              ingresos, egresos e historial.
            </p>

          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-4">

            <DashboardCard
              title="Balance"
              value="$125.430"
            />

            <DashboardCard
              title="Ingresos"
              value="$380.000"
              green
            />

            <DashboardCard
              title="Egresos"
              value="$254.570"
              red
            />

            <DashboardCard
              title="Movimientos"
              value="28"
            />

          </div>

        </div>

      </section>

      {/* =========================
          MI CUENTA
      ========================== */}

      <section
        id="cuenta"
        className="border-t border-white/5 px-6 py-24 lg:px-10"
      >

        <div className="mx-auto max-w-7xl">

          <div className="max-w-3xl">

            <div className="text-sm font-bold uppercase tracking-[3px] text-[#27d59b]">
              Mi Cuenta
            </div>

            <h2 className="mt-4 text-4xl font-black sm:text-5xl">
              Tu cuenta, tus reglas.
            </h2>

            <p className="mt-5 text-gray-400">
              Administrá tu información personal y la seguridad
              de tu cuenta desde un espacio separado de tus movimientos.
            </p>

          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">

            <Feature
              icon="👤"
              title="Perfil"
              text="Modificá nombre, correo y foto de perfil."
            />

            <Feature
              icon="🔐"
              title="Seguridad"
              text="Contraseña, sesiones y verificación en dos pasos."
            />

            <Feature
              icon="🛡️"
              title="Privacidad"
              text="Tu información financiera queda aislada de otros usuarios."
            />

          </div>

        </div>

      </section>

      {/* =========================
          PRO
      ========================== */}

      <section
        id="pro"
        className="border-y border-purple-500/10 bg-gradient-to-br from-[#110d18] to-[#170d21] px-6 py-24 lg:px-10"
      >

        <div className="mx-auto max-w-7xl text-center">

          <div className="inline-flex rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-300">
            ✦ HORMIGUITA PRO
          </div>

          <h2 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
            Llevá tus finanzas un paso más allá.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-400">
            Una vista previa de los beneficios que tendrá
            la versión premium de HormiGUITA.
          </p>

          <div className="mt-12 grid gap-5 md:grid-cols-3">

            <ProCard
              icon="🤖"
              title="IA financiera"
              text="Interpretación inteligente de audios y mensajes."
            />

            <ProCard
              icon="📈"
              title="Reportes avanzados"
              text="Analizá hábitos, categorías y evolución financiera."
            />

            <ProCard
              icon="🎯"
              title="Metas y alertas"
              text="Creá objetivos, presupuestos y avisos."
            />

          </div>

        </div>

      </section>

      {/* =========================
          FOOTER
      ========================== */}

      <footer className="border-t border-white/5 px-6 py-8 lg:px-10">

        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-gray-500 sm:flex-row">

          <div>
            🐜 Hormi
            <span className="text-[#27d59b]">
              GUITA
            </span>
          </div>

          <div>
            Controlá tu dinero. Construí tu GUITA.
          </div>

        </div>

      </footer>

    </main>
  );
}

/* =========================
   COMPONENTE FEATURE
========================= */

function Feature({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-[#111720] p-6 transition hover:-translate-y-1 hover:border-[#27d59b]/30">

      <div className="text-3xl">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-bold">
        {title}
      </h3>

      <p className="mt-2 text-gray-500">
        {text}
      </p>

    </div>
  );
}

/* =========================
   DASHBOARD CARD
========================= */

function DashboardCard({
  title,
  value,
  green,
  red,
}: {
  title: string;
  value: string;
  green?: boolean;
  red?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-[#111720] p-6">

      <div className="text-sm text-gray-500">
        {title}
      </div>

      <div
        className={`mt-3 text-2xl font-black ${
          green
            ? "text-[#27d59b]"
            : red
              ? "text-red-400"
              : "text-white"
        }`}
      >
        {value}
      </div>

    </div>
  );
}

/* =========================
   PRO CARD
========================= */

function ProCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-purple-500/10 bg-[#14101c] p-7 text-left transition hover:-translate-y-1 hover:border-purple-500/30">

      <div className="text-3xl">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-bold">
        {title}
      </h3>

      <p className="mt-2 text-gray-500">
        {text}
      </p>

    </div>
  );
}