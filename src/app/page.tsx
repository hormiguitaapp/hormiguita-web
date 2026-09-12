"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type ChatMessage = {
  kind: "user" | "hormi" | "meta";
  type: "text" | "audio";
  text: string;
  meta?: string;
  duration?: string;
};

const chatSteps: readonly ChatMessage[] = [
  {
    kind: "user",
    type: "text",
    text: "Gasté 20 lucas en comida",
  },
  {
    kind: "hormi",
    type: "text",
    text: "Listo. Registré $20.000 en Alimentación.",
    meta: "Gasto · Alimentación",
  },
  {
    kind: "user",
    type: "audio",
    text: "Te dejo un audio",
    duration: "0:08",
  },
  {
    kind: "hormi",
    type: "text",
    text: "Perfecto. Registré $35.000 en Transporte.",
    meta: "Gasto · Transporte",
  },
  {
    kind: "user",
    type: "text",
    text: "Quiero ahorrar para una MacBook",
  },
  {
    kind: "hormi",
    type: "text",
    text: "Dale. Creé la meta “MacBook” por USD 1.200.",
    meta: "Meta · USD",
  },
  {
    kind: "user",
    type: "text",
    text: "Separé 50 lucas para la meta",
  },
  {
    kind: "hormi",
    type: "text",
    text: "Hecho. Sumé $50.000 a tu meta.",
    meta: "Aporte · MacBook",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatTick, setChatTick] = useState(0);
  const chatIndex = chatTick % chatSteps.length;

  // Mostramos como máximo 3 mensajes. Cuando llega uno nuevo, el más viejo
  // sale por arriba y el contenedor nunca cambia de tamaño.
  const visibleCount = Math.min(3, chatTick + 1);
  const visibleChatSteps = Array.from({ length: visibleCount }, (_, offset) => {
    const index = (chatIndex - visibleCount + 1 + offset + chatSteps.length) % chatSteps.length;
    return chatSteps[index];
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setChatTick((current) => current + 1);
    }, 2200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#07090b] text-white selection:bg-[#39d98f]/30">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[18%] top-[6%] h-[520px] w-[520px] rounded-full bg-[#39d98f]/[0.035] blur-[140px]" />
        <div className="absolute right-[8%] top-[22%] h-[420px] w-[420px] rounded-full bg-[#39d98f]/[0.025] blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.022),transparent_42%)]" />
      </div>
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        @keyframes floatSoft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes pulseSoft {
          0%, 100% { opacity: .45; transform: scale(.96); }
          50% { opacity: 1; transform: scale(1); }
        }

        @keyframes messageIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes messageFade {
          0% { opacity: 1; transform: translateY(0); }
          78% { opacity: 1; transform: translateY(0); }
          92% { opacity: .72; transform: translateY(-4px); }
          100% { opacity: 0; transform: translateY(-14px); }
        }

        @keyframes wave {
          0%, 100% { transform: scaleY(.45); }
          50% { transform: scaleY(1); }
        }

        @keyframes audioWave {
          0%, 100% { opacity: .35; transform: scaleY(.65); }
          50% { opacity: 1; transform: scaleY(1); }
        }

        .animate-float-soft { animation: floatSoft 5s ease-in-out infinite; }
        .animate-pulse-soft { animation: pulseSoft 2.4s ease-in-out infinite; }
        .animate-message-in { animation: messageIn .45s ease-out both; }
        .animate-message-fade { animation: messageFade 2.15s ease-in-out both; }
        .wave-bar { animation: wave 1s ease-in-out infinite; transform-origin: center; }
        .audio-wave { animation: audioWave .9s ease-in-out infinite; transform-origin: center; }
      `}</style>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-white/[0.065] bg-[#07090b]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-10">
          <a href="#inicio" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5">
            <Image
              src="/logo-HormiGUITA.png"
              alt="Logo HormiGUITA"
              width={42}
              height={42}
              priority
              className="object-contain"
            />
            <span className="text-[20px] font-extrabold tracking-[-0.8px]">
              Hormi<span className="text-[#39d98f]">GUITA</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 md:flex">
            <a href="#como-funciona" className="text-[13px] font-medium text-white/55 transition hover:text-white">
              Cómo funciona
            </a>
            <a href="#metas" className="text-[13px] font-medium text-white/55 transition hover:text-white">
              Metas
            </a>
            <a href="#dolar" className="text-[13px] font-medium text-white/55 transition hover:text-white">
              Dólar
            </a>
            <a href="#panel" className="text-[13px] font-medium text-white/55 transition hover:text-white">
              Panel
            </a>
            <a href="#pro" className="text-[13px] font-semibold text-[#39d98f] transition hover:text-[#7ceab3]">
              Pro
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2.5 text-[13px] font-semibold text-white/70 transition hover:bg-white/5 hover:text-white sm:block"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="hidden rounded-full bg-[#39d98f] px-5 py-2.5 text-[13px] font-bold text-[#06130d] shadow-[0_10px_30px_rgba(57,217,143,.16)] transition hover:-translate-y-0.5 hover:bg-[#5ce4a2] sm:block"
            >
              Empezar gratis
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] md:hidden"
              aria-label="Abrir menú"
            >
              {menuOpen ? "×" : "☰"}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-white/[0.065] bg-[#070a09] px-5 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {[
                ["Cómo funciona", "#como-funciona"],
                ["Metas", "#metas"],
                ["Dólar", "#dolar"],
                ["Panel", "#panel"],
                ["Pro", "#pro"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-white/65 hover:bg-white/[0.04] hover:text-white"
                >
                  {label}
                </a>
              ))}
              <Link
                href="/registro"
                onClick={() => setMenuOpen(false)}
                className="mt-2 rounded-xl bg-[#39d98f] px-4 py-3 text-center text-sm font-bold text-[#06130d]"
              >
                Empezar gratis
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="inicio" className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-[#39d98f]/[0.055] blur-[120px]" />
        <div className="pointer-events-none absolute right-[-180px] top-[140px] h-[520px] w-[520px] rounded-full bg-[#39d98f]/[0.032] blur-[130px]" />

        <div className="mx-auto grid min-h-[calc(100vh-74px)] max-w-7xl items-center gap-16 px-5 py-16 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-10 lg:py-16">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#39d98f]/15 bg-[#39d98f]/[0.055] px-3.5 py-2 text-[12px] font-semibold text-[#9af0c5]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#39d98f] shadow-[0_0_12px_rgba(57,217,143,.8)]" />
              Tu plata, entendida en tu idioma.
            </div>

            <h1 className="max-w-[720px] text-[48px] font-semibold leading-[.96] tracking-[-3.5px] sm:text-[64px] lg:text-[76px]">
              Ordená tu plata.
              <br />
              <span className="text-[#39d98f]">Construí tu GUITA.</span>
            </h1>

            <p className="mt-7 max-w-xl text-[17px] leading-7 text-white/52 sm:text-[18px]">
              Escribí como hablás, mandá un audio y dejá que HormiGUITA haga el resto.
              Gastos, ingresos, metas, dólares y todo tu movimiento financiero en un solo lugar.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/registro"
                className="rounded-full bg-[#39d98f] px-7 py-3.5 text-center text-[14px] font-bold text-[#06130d] shadow-[0_16px_40px_rgba(57,217,143,.14)] transition hover:-translate-y-0.5 hover:bg-[#5ce4a2]"
              >
                Empezar gratis
              </Link>
              <a
                href="#como-funciona"
                className="rounded-full border border-white/10 px-7 py-3.5 text-center text-[14px] font-semibold text-white/75 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
              >
                Ver cómo funciona
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12px] text-white/35">
              <span>✓ Texto natural</span>
              <span>✓ Audio</span>
              <span>✓ Metas en pesos y USD</span>
              <span>✓ Dólar oficial</span>
            </div>
          </div>

          {/* CHAT HERO */}
          <div className="relative mx-auto w-full max-w-[590px] lg:ml-auto">
            <div className="absolute -inset-8 rounded-[48px] bg-[#39d98f]/[0.032] blur-3xl" />
            <div className="animate-float-soft relative flex h-[560px] flex-col overflow-hidden rounded-[26px] border border-white/[0.085] bg-[#0b100e]/96 shadow-[0_30px_90px_rgba(0,0,0,.52)] sm:h-[610px]">
              <div className="flex shrink-0 items-center justify-between border-b border-white/[0.065] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#39d98f]/10 text-[#39d98f]">
                    <span className="text-sm">🐜</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold">HormiGUITA</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/35">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#39d98f]" />
                      asistente financiero
                    </div>
                  </div>
                </div>
                <span className="rounded-full border border-white/[0.065] px-2.5 py-1 text-[10px] text-white/35">
                  inteligente
                </span>
              </div>

              <div className="relative min-h-0 flex-1 overflow-hidden px-4 py-5 sm:px-6">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-20 bg-gradient-to-b from-[#0c110f] via-[#0c110f]/85 to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-8 bg-gradient-to-t from-[#0c110f]/35 to-transparent" />

                {/* Ventana de mensajes: altura fija. El contenido nunca modifica el layout. */}
                <div className="absolute inset-x-4 inset-y-5 overflow-hidden sm:inset-x-6">
                  <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end gap-4">
                    {visibleChatSteps.map((message, index) => (
                      <div
                        key={message.text}
                        className={`flex shrink-0 ${index === 0 && visibleCount === 3 ? "animate-message-fade" : "animate-message-in"} ${message.kind === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[84%] rounded-[18px] px-4 py-3 text-[13px] leading-5 ${
                            message.kind === "user"
                              ? "rounded-br-[5px] bg-white/[0.075] text-white/80"
                              : "rounded-bl-[5px] border border-white/[0.065] bg-[#111814] text-white/75"
                          }`}
                        >
                          {message.type === "audio" ? (
                            <div className="flex min-w-[190px] items-center gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#39d98f] text-[11px] font-bold text-[#06130d]">▶</span>
                              <div className="flex flex-1 items-center gap-1">
                                {[7, 13, 9, 18, 11, 16, 8, 20, 12, 17, 10, 14, 8, 16, 11, 19, 9, 13, 7].map((height, waveIndex) => (
                                  <span
                                    key={waveIndex}
                                    className="audio-wave block w-[2px] rounded-full bg-[#39d98f]/75"
                                    style={{ height: `${height}px`, animationDelay: `${waveIndex * 45}ms` }}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-white/35">{message.duration}</span>
                            </div>
                          ) : (
                            <>
                              <div>{message.text}</div>
                              {message.meta && (
                                <div className="mt-2 border-t border-white/[0.06] pt-2 text-[10px] font-medium text-[#39d98f]/80">
                                  {message.meta}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-white/[0.065] px-4 py-4 sm:px-6">
                <div className="flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.018] px-4 py-3">
                  <span className="text-[12px] text-white/25">Escribile a HormiGUITA...</span>
                  <span className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#39d98f] text-xs text-[#06130d]">↑</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTELIGENCIA */}
      <section id="como-funciona" className="border-t border-white/[0.06] px-5 py-24 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="HormiGUITA entiende"
            title="Hablale como le hablarías a una persona."
            text="No necesitás completar formularios ni pensar en categorías. Escribí lo que hiciste y HormiGUITA interpreta el movimiento."
          />

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <NaturalExample
              input="Gasté 20 lucas en comida"
              output="-$20.000"
              label="Alimentación"
            />
            <NaturalExample
              input="Cobré 300k por un laburo"
              output="+$300.000"
              label="Trabajo"
              positive
            />
            <NaturalExample
              input="Separé 50 lucas para la Mac"
              output="$50.000"
              label="Aporte a meta"
              goal
            />
          </div>
        </div>
      </section>

      {/* METAS */}
      <section id="metas" className="border-t border-white/[0.06] bg-[#0a0d0c] px-5 py-24 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Metas"
            title="No solo registrás plata. Le ponés un destino."
            text="Creá objetivos, hacé aportes y mirá cómo cada pequeño movimiento te acerca a lo que querés conseguir."
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
            <div className="rounded-[26px] border border-white/[0.08] bg-[#0c1110] p-6 sm:p-8 shadow-[0_18px_55px_rgba(0,0,0,.18)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[2px] text-white/25">Meta activa</div>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-1px]">MacBook</h3>
                  <p className="mt-1 text-sm text-white/35">Para tu próxima herramienta de trabajo.</p>
                </div>
                <span className="rounded-full border border-[#39d98f]/15 bg-[#39d98f]/[0.06] px-3 py-1.5 text-[11px] font-semibold text-[#7ceab3]">35%</span>
              </div>

              <div className="mt-10 flex items-end justify-between">
                <div>
                  <div className="text-4xl font-semibold tracking-[-2px]">$420.000</div>
                  <div className="mt-1 text-xs text-white/30">de $1.200.000</div>
                </div>
                <div className="text-right text-xs text-white/30">Faltan $780.000</div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full w-[35%] rounded-full bg-[#39d98f] shadow-[0_0_18px_rgba(57,217,143,.28)]" />
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-5 text-xs text-white/30">
                <span>Último aporte · $50.000</span>
                <span className="text-[#39d98f]">Seguí sumando →</span>
              </div>
            </div>

            <div className="rounded-[26px] border border-white/[0.08] bg-[#0c1110] p-6 sm:p-8 shadow-[0_18px_55px_rgba(0,0,0,.18)]">
              <div className="text-[11px] uppercase tracking-[2px] text-white/25">Tus objetivos</div>
              <div className="mt-6 space-y-3">
                <GoalRow name="MacBook" progress="35%" amount="$420.000" />
                <GoalRow name="Viaje" progress="62%" amount="$310.000" />
                <GoalRow name="Fondo de emergencia" progress="18%" amount="$180.000" />
              </div>
              <div className="mt-6 rounded-2xl border border-dashed border-white/[0.1] px-4 py-4 text-center text-xs text-white/35">
                + Crear una nueva meta
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* USD + DOLAR */}
      <section id="dolar" className="border-t border-white/[0.06] px-5 py-24 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Pesos + dólares"
            title="Tus metas también pueden pensar en USD."
            text="Si estás ahorrando para algo que se mide en dólares, HormiGUITA puede mostrar cuánto llevás y cuánto te falta."
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_.75fr]">
            <div className="rounded-[26px] border border-white/[0.08] bg-[#0c1110] p-6 sm:p-8 shadow-[0_18px_55px_rgba(0,0,0,.18)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[2px] text-white/25">Meta en USD</div>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-1px]">MacBook</h3>
                </div>
                <div className="rounded-full bg-white/[0.05] px-3 py-1.5 text-[11px] text-white/45">USD</div>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <UsdMetric label="Objetivo" value="USD 1.200" />
                <UsdMetric label="Ahorrado" value="USD 420" green />
                <UsdMetric label="Falta" value="USD 780" />
              </div>

              <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full w-[35%] rounded-full bg-[#39d98f]" />
              </div>
              <div className="mt-3 flex justify-between text-[11px] text-white/25">
                <span>35% completado</span>
                <span>65% restante</span>
              </div>
            </div>

            <div className="rounded-[26px] border border-[#39d98f]/10 bg-[#0c1110] p-6 sm:p-8 shadow-[0_18px_55px_rgba(0,0,0,.18)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[2px] text-white/25">Cotización</div>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-1px]">Dólar oficial</h3>
                </div>
                <span className="animate-pulse-soft h-2 w-2 rounded-full bg-[#39d98f]" />
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <DollarBox label="Compra" value="—" />
                <DollarBox label="Venta" value="—" />
              </div>

              <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[11px] leading-5 text-white/30">
                Valor actualizado automáticamente para que puedas ver tus metas en pesos y en dólares.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PANEL */}
      <section id="panel" className="border-t border-white/[0.06] bg-[#0a0d0c] px-5 py-24 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Panel de control"
            title="Todo tu movimiento. Sin ruido."
            text="Un vistazo para saber cuánto entra, cuánto sale, en qué gastás y qué tan cerca estás de tus metas."
          />

          <div className="mt-12 overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#0c1110] shadow-[0_30px_80px_rgba(0,0,0,.28)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.065] px-5 py-5 sm:px-7">
              <div>
                <div className="text-[11px] uppercase tracking-[2px] text-white/25">Resumen financiero</div>
                <div className="mt-1 text-sm font-semibold">Septiembre 2026</div>
              </div>
              <div className="rounded-full border border-white/[0.065] px-3 py-1.5 text-[11px] text-white/35">Este mes</div>
            </div>

            <div className="grid gap-px bg-white/[0.05] sm:grid-cols-4">
              <DashboardMetric title="Balance" value="$125.430" />
              <DashboardMetric title="Ingresos" value="$380.000" green />
              <DashboardMetric title="Gastos" value="$254.570" red />
              <DashboardMetric title="Metas" value="2 activas" />
            </div>

            <div className="grid gap-px bg-white/[0.05] lg:grid-cols-[1.2fr_.8fr]">
              <div className="bg-[#0c1110] p-6 sm:p-8 shadow-[0_18px_55px_rgba(0,0,0,.18)]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Evolución</div>
                    <div className="mt-1 text-[11px] text-white/25">Ingresos vs. gastos</div>
                  </div>
                  <span className="text-[11px] text-[#39d98f]">+12,4%</span>
                </div>
                <FakeChart />
              </div>

              <div className="bg-[#0c1110] p-6 sm:p-8 shadow-[0_18px_55px_rgba(0,0,0,.18)]">
                <div className="text-sm font-semibold">Gastos por categoría</div>
                <div className="mt-6 space-y-4">
                  <CategoryBar name="Alimentación" percent="42%" width="42%" />
                  <CategoryBar name="Transporte" percent="22%" width="22%" />
                  <CategoryBar name="Servicios" percent="18%" width="18%" />
                  <CategoryBar name="Ocio" percent="11%" width="11%" />
                  <CategoryBar name="Otros" percent="7%" width="7%" />
                </div>
              </div>
            </div>

            <div className="border-t border-white/[0.065] bg-[#0c1110] p-6 sm:p-8 shadow-[0_18px_55px_rgba(0,0,0,.18)]">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Últimos movimientos</div>
                <span className="text-[11px] text-white/25">Ver todos →</span>
              </div>
              <div className="mt-5 grid gap-2">
                <Movement name="Supermercado" category="Alimentación" amount="-$20.000" />
                <Movement name="Trabajo freelance" category="Trabajo" amount="+$300.000" positive />
                <Movement name="Internet" category="Servicios" amount="-$18.500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="border-t border-white/[0.06] px-5 py-24 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Cómo funciona"
            title="Tres pasos. Nada más."
            text="La experiencia está pensada para que registrar tu plata sea algo que realmente hagas."
          />

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <Step number="01" title="Contale qué pasó" text="Escribí o mandá un audio como lo harías normalmente." />
            <Step number="02" title="HormiGUITA lo entiende" text="Interpreta monto, tipo, categoría, fecha y si corresponde a una meta." />
            <Step number="03" title="Vos seguís" text="La información queda ordenada y disponible en tu panel." />
          </div>
        </div>
      </section>

      {/* PRO */}
      <section id="pro" className="border-t border-[#39d98f]/10 bg-[#0a110d] px-5 py-24 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex rounded-full border border-[#39d98f]/15 bg-[#39d98f]/[0.06] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-[#7ceab3]">
            HormiGUITA Pro
          </div>
          <h2 className="mt-6 text-4xl font-semibold tracking-[-2px] sm:text-5xl">Más control, cuando lo necesites.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/40">
            La versión Pro puede llevar el asistente, las metas y el análisis mucho más lejos. La base sigue siendo la misma: simple y clara.
          </p>

          <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">
            <ProFeature title="Asistente inteligente" text="Texto y audio para registrar y consultar." />
            <ProFeature title="Metas avanzadas" text="Objetivos, aportes y metas en USD." />
            <ProFeature title="Análisis" text="Más detalle sobre tus hábitos y evolución." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-24 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[32px] border border-[#39d98f]/10 bg-gradient-to-br from-[#0f1a14] to-[#0b100d] px-6 py-14 text-center sm:px-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#39d98f]/10 text-lg">🐜</div>
          <h2 className="mt-6 text-4xl font-semibold tracking-[-2px] sm:text-5xl">Empezá a ordenar tu GUITA.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/40 sm:text-base">
            Registrá tus primeros movimientos, creá una meta y empezá a ver tu plata de otra manera.
          </p>
          <Link
            href="/registro"
            className="mt-8 inline-flex rounded-full bg-[#39d98f] px-7 py-3.5 text-sm font-bold text-[#06130d] shadow-[0_18px_45px_rgba(57,217,143,.15)] transition hover:-translate-y-0.5 hover:bg-[#5ce4a2]"
          >
            Crear mi cuenta gratis
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-5 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-[12px] text-white/25 sm:flex-row">
          <div className="font-semibold text-white/45">
            Hormi<span className="text-[#39d98f]">GUITA</span>
          </div>
          <div>Controlá tu dinero. Construí tu GUITA.</div>
        </div>
      </footer>
    </main>
  );
}

function SectionIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-3xl">
      <div className="text-[11px] font-semibold uppercase tracking-[2.5px] text-[#39d98f]">{eyebrow}</div>
      <h2 className="mt-4 text-4xl font-semibold leading-[1.02] tracking-[-2px] sm:text-5xl">{title}</h2>
      <p className="mt-5 max-w-2xl text-base leading-7 text-white/40 sm:text-[17px]">{text}</p>
    </div>
  );
}

function NaturalExample({ input, output, label, positive, goal }: { input: string; output: string; label: string; positive?: boolean; goal?: boolean }) {
  return (
    <div className="rounded-[24px] border border-white/[0.065] bg-[#0c1110] p-5 transition hover:-translate-y-1 hover:border-[#39d98f]/15">
      <div className="text-[10px] uppercase tracking-[1.8px] text-white/20">Vos decís</div>
      <div className="mt-3 text-[16px] font-medium text-white/80">“{input}”</div>
      <div className="my-5 h-px bg-white/[0.06]" />
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className={`text-2xl font-semibold tracking-[-1px] ${positive ? "text-[#39d98f]" : goal ? "text-white" : "text-white/85"}`}>{output}</div>
          <div className="mt-1 text-[11px] text-white/30">{label}</div>
        </div>
        <span className="rounded-full border border-white/[0.065] px-2.5 py-1 text-[10px] text-white/25">HormiGUITA</span>
      </div>
    </div>
  );
}

function GoalRow({ name, progress, amount }: { name: string; progress: string; amount: string }) {
  const width = progress;
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-medium text-white/75">{name}</div>
        <div className="text-[11px] text-white/30">{amount} · {progress}</div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-[#39d98f]" style={{ width }} />
      </div>
    </div>
  );
}

function UsdMetric({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="text-[11px] text-white/25">{label}</div>
      <div className={`mt-2 text-lg font-semibold ${green ? "text-[#39d98f]" : "text-white/80"}`}>{value}</div>
    </div>
  );
}

function DollarBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.018] p-4">
      <div className="text-[11px] text-white/25">{label}</div>
      <div className="mt-2 text-xl font-semibold text-white/80">{value}</div>
    </div>
  );
}

function DashboardMetric({ title, value, green, red }: { title: string; value: string; green?: boolean; red?: boolean }) {
  return (
    <div className="bg-[#0c1110] p-5 sm:p-6">
      <div className="text-[11px] text-white/25">{title}</div>
      <div className={`mt-2 text-xl font-semibold tracking-[-.5px] ${green ? "text-[#39d98f]" : red ? "text-red-300" : "text-white/80"}`}>{value}</div>
    </div>
  );
}

function FakeChart() {
  return (
    <div className="mt-7 h-48 overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.015] p-4">
      <svg viewBox="0 0 600 170" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 132 C55 118 70 125 115 104 S190 118 235 91 S315 101 360 74 S445 90 490 55 S555 68 600 35" fill="none" stroke="rgba(57,217,143,.85)" strokeWidth="2.5" />
        <path d="M0 145 C55 140 78 132 115 139 S185 125 235 129 S305 118 360 121 S430 105 490 113 S550 94 600 102" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="2" />
        <path d="M0 132 C55 118 70 125 115 104 S190 118 235 91 S315 101 360 74 S445 90 490 55 S555 68 600 35 L600 170 L0 170 Z" fill="rgba(57,217,143,.045)" />
      </svg>
    </div>
  );
}

function CategoryBar({ name, percent, width }: { name: string; percent: string; width: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-white/45">{name}</span>
        <span className="text-white/25">{percent}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div className="h-full rounded-full bg-white/25" style={{ width }} />
      </div>
    </div>
  );
}

function Movement({ name, category, amount, positive }: { name: string; category: string; amount: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-white/65">{name}</div>
        <div className="mt-1 text-[10px] text-white/25">{category}</div>
      </div>
      <div className={`text-xs font-semibold ${positive ? "text-[#39d98f]" : "text-white/55"}`}>{amount}</div>
    </div>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-white/[0.065] bg-[#0c1110] p-6">
      <div className="text-[11px] font-semibold tracking-[1.5px] text-[#39d98f]">{number}</div>
      <h3 className="mt-8 text-xl font-semibold tracking-[-.5px]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/35">{text}</p>
    </div>
  );
}

function ProFeature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[22px] border border-white/[0.065] bg-white/[0.02] p-5">
      <div className="text-sm font-semibold text-white/75">{title}</div>
      <div className="mt-2 text-xs leading-5 text-white/30">{text}</div>
    </div>
  );
}
