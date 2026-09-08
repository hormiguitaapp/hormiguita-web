"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Transaction = {
  id: string;
  user_id: string;
  category_id: string | null;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  source: "manual" | "whatsapp_text" | "whatsapp_audio";
  transaction_date: string;
};

type Category = {
  id: string;
  user_id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
};

type Profile = {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

const DEFAULT_CATEGORIES = [
  { name: "Alimentación", type: "expense" as const, icon: "🍔" },
  { name: "Transporte", type: "expense" as const, icon: "🚗" },
  { name: "Vivienda", type: "expense" as const, icon: "🏠" },
  { name: "Servicios", type: "expense" as const, icon: "💡" },
  { name: "Salud", type: "expense" as const, icon: "❤️" },
  { name: "Ocio", type: "expense" as const, icon: "🎮" },
  { name: "Compras", type: "expense" as const, icon: "🛍️" },
  { name: "Otros", type: "expense" as const, icon: "📦" },

  { name: "Sueldo", type: "income" as const, icon: "💼" },
  { name: "Trabajo", type: "income" as const, icon: "💰" },
  { name: "Ventas", type: "income" as const, icon: "🛒" },
  { name: "Negocio", type: "income" as const, icon: "🏢" },
  { name: "Inversiones", type: "income" as const, icon: "📈" },
  { name: "Otros", type: "income" as const, icon: "➕" },
];

const CHART_COLORS = [
  "#27d59b",
  "#4f8cff",
  "#a855f7",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#8b5cf6",
];

const money = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function sourceLabel(source: Transaction["source"]) {
  if (source === "whatsapp_audio") return "🎙️ Audio";
  if (source === "whatsapp_text") return "💬 WhatsApp";
  return "✍️ Manual";
}

function sourceIcon(source: Transaction["source"]) {
  if (source === "whatsapp_audio") return "🎙️";
  if (source === "whatsapp_text") return "💬";
  return "✍️";
}

type ExpenseCategory = {
  id: string;
  name: string;
  icon: string;
  amount: number;
  percentage: number;
  color: string;
};

function PieChart({
  data,
}: {
  data: ExpenseCategory[];
}) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;

  return (
    <div className="flex flex-col items-center justify-center gap-6 lg:flex-row">
      <div className="relative flex h-56 w-56 shrink-0 items-center justify-center">
        <svg
          viewBox="0 0 220 220"
          className="h-56 w-56 -rotate-90"
        >
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="#1b2430"
            strokeWidth="42"
          />

          {data.map((item) => {
            const segmentLength =
              (item.percentage / 100) * circumference;

            const dashOffset = -accumulated;

            accumulated += segmentLength;

            return (
              <circle
                key={item.id}
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="42"
                strokeDasharray={`${segmentLength} ${
                  circumference - segmentLength
                }`}
                strokeDashoffset={dashOffset}
              />
            );
          })}

          <circle
            cx="110"
            cy="110"
            r="55"
            fill="#111720"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-medium text-gray-500">
            Gastos
          </span>

          <span className="mt-1 text-xl font-black text-white">
            {money(
              data.reduce(
                (total, item) => total + item.amount,
                0
              )
            )}
          </span>
        </div>
      </div>

      <div className="w-full space-y-3">
        {data.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />

              <span className="truncate text-sm text-gray-300">
                {item.icon} {item.name}
              </span>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-sm font-bold text-white">
                {money(item.amount)}
              </div>

              <div className="text-xs text-gray-500">
                {item.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [avatarDisplayUrl, setAvatarDisplayUrl] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [type, setType] =
    useState<"income" | "expense">("expense");

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [source, setSource] = useState<
    "manual" | "whatsapp_text" | "whatsapp_audio"
  >("manual");

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(
          `Error de autenticación: ${userError.message}`
        );
      }

      if (!user) {
        throw new Error("No hay una sesión iniciada.");
      }

      /*
       * PERFIL
       */

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw new Error(
          `Error al cargar perfil: ${profileError.message}`
        );
      }

      /*
       * AVATAR
       */

      if (profileData?.avatar_url) {
        if (profileData.avatar_url.startsWith("http")) {
          setAvatarDisplayUrl(profileData.avatar_url);
        } else {
          const {
            data: signedData,
            error: signedError,
          } = await supabase.storage
            .from("avatars")
            .createSignedUrl(
              profileData.avatar_url,
              60 * 60
            );

          if (signedError) {
            console.error(
              "Error creando URL firmada del avatar:",
              signedError
            );

            setAvatarDisplayUrl(null);
          } else {
            setAvatarDisplayUrl(
              signedData?.signedUrl ?? null
            );
          }
        }
      } else {
        setAvatarDisplayUrl(null);
      }

      /*
       * MOVIMIENTOS
       */

      const {
        data: transactionData,
        error: transactionError,
      } = await supabase
        .from("transactions")
        .select(
          "id, user_id, category_id, type, amount, description, source, transaction_date"
        )
        .eq("user_id", user.id)
        .order("transaction_date", {
          ascending: false,
        });

      if (transactionError) {
        throw new Error(
          `Error al cargar movimientos: ${transactionError.message}`
        );
      }

      /*
       * CATEGORÍAS
       */

      let {
        data: categoryData,
        error: categoryError,
      } = await supabase
        .from("categories")
        .select("id, user_id, name, type, icon")
        .eq("user_id", user.id)
        .order("name", {
          ascending: true,
        });

      if (categoryError) {
        throw new Error(
          `Error al cargar categorías: ${categoryError.message}`
        );
      }

      /*
       * SI NO HAY CATEGORÍAS
       */

      if (!categoryData || categoryData.length === 0) {
        const categoriesToCreate =
          DEFAULT_CATEGORIES.map((category) => ({
            user_id: user.id,
            name: category.name,
            type: category.type,
            icon: category.icon,
          }));

        const {
          data: createdCategories,
          error: createError,
        } = await supabase
          .from("categories")
          .insert(categoriesToCreate)
          .select(
            "id, user_id, name, type, icon"
          );

        if (createError) {
          throw new Error(
            `No se pudieron crear las categorías: ${createError.message}`
          );
        }

        categoryData = createdCategories ?? [];
      }

      console.log("USUARIO:", user.id);
      console.log("CATEGORÍAS:", categoryData);

      setProfile(profileData ?? null);
      setTransactions(transactionData ?? []);
      setCategories(categoryData ?? []);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado."
      );
    }

    setLoading(false);
  }

  /*
   * CATEGORÍAS SEGÚN EL TIPO
   */

  const currentCategories = useMemo(() => {
    return categories.filter(
      (category) => category.type === type
    );
  }, [categories, type]);

  /*
   * TOTALES
   */

  const totalIncome = transactions
    .filter(
      (transaction) => transaction.type === "income"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    );

  const totalExpense = transactions
    .filter(
      (transaction) => transaction.type === "expense"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    );

  const balance = totalIncome - totalExpense;

  /*
   * GASTOS POR CATEGORÍA
   */

  const expenseCategories = useMemo<ExpenseCategory[]>(() => {
    const expenseMap = new Map<
      string,
      {
        id: string;
        name: string;
        icon: string;
        amount: number;
      }
    >();

    transactions
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .forEach((transaction) => {
        const category = categories.find(
          (item) =>
            item.id === transaction.category_id
        );

        const id =
          transaction.category_id ??
          "uncategorized";

        const current = expenseMap.get(id);

        if (current) {
          current.amount += Number(
            transaction.amount
          );
        } else {
          expenseMap.set(id, {
            id,
            name:
              category?.name ??
              "Sin categoría",
            icon:
              category?.icon ??
              "📦",
            amount:
              Number(transaction.amount),
          });
        }
      });

    const total = Array.from(expenseMap.values()).reduce(
      (sum, item) => sum + item.amount,
      0
    );

    return Array.from(expenseMap.values())
      .sort((a, b) => b.amount - a.amount)
      .map((item, index) => ({
        ...item,
        percentage:
          total > 0
            ? (item.amount / total) * 100
            : 0,
        color:
          CHART_COLORS[
            index % CHART_COLORS.length
          ],
      }));
  }, [transactions, categories]);

  /*
   * OBTENER NOMBRE DE CATEGORÍA
   */

  function getCategoryName(
    categoryId: string | null
  ) {
    if (!categoryId) return "Sin categoría";

    const category = categories.find(
      (item) => item.id === categoryId
    );

    return category?.name ?? "Sin categoría";
  }

  /*
   * ABRIR MODAL
   */

  function openNewTransaction() {
    setType("expense");
    setDescription("");
    setAmount("");
    setCategoryId("");
    setSource("manual");

    setDate(
      new Date().toISOString().split("T")[0]
    );

    setError("");
    setShowModal(true);
  }

  /*
   * GUARDAR MOVIMIENTO
   */

  async function saveTransaction() {
    setError("");

    if (!description.trim()) {
      setError("Ingresá una descripción.");
      return;
    }

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Ingresá un monto válido.");
      return;
    }

    if (!categoryId) {
      setError("Seleccioná una categoría.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(
        "La sesión expiró. Volvé a iniciar sesión."
      );

      return;
    }

    setSaving(true);

    const { error: insertError } =
      await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          category_id: categoryId,
          type,
          amount: numericAmount,
          description: description.trim(),
          source,
          transaction_date: date,
        });

    if (insertError) {
      console.error(insertError);

      setError(
        `No se pudo guardar el movimiento: ${insertError.message}`
      );

      setSaving(false);
      return;
    }

    setSaving(false);
    setShowModal(false);

    await loadDashboard();
  }

  /*
   * LOGOUT
   */

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  /*
   * LOADING
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080a0d] text-white">
        <div className="text-center">
          <div className="mb-4 text-5xl">
            🐜
          </div>

          <p className="text-gray-400">
            Cargando tu HormiGUITA...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080a0d] text-white">

      {/* ======================
          SIDEBAR
      ======================= */}

      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-white/10 bg-[#0b1016] p-5 lg:block">

        <Link
          href="/"
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

        <nav className="mt-10 space-y-2">

          <div className="rounded-xl bg-[#27d59b]/10 px-4 py-3 font-semibold text-[#27d59b]">
            🏠 Inicio
          </div>

          <div className="rounded-xl px-4 py-3 text-gray-400">
            📊 Resumen
          </div>

          <Link
            href="/dashboard/historial"
            className="block rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            📋 Historial
          </Link>

          <div className="rounded-xl px-4 py-3 text-gray-400">
            🎯 Objetivos
          </div>

          <Link
            href="/perfil"
            className="block rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            ⚙️ Mi cuenta
          </Link>

        </nav>

        <div className="absolute bottom-5 left-5 right-5">

          <button
            onClick={logout}
            className="w-full rounded-xl border border-gray-800 px-4 py-3 text-left text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            ↩ Cerrar sesión
          </button>

        </div>

      </aside>

      {/* ======================
          CONTENIDO
      ======================= */}

      <section className="lg:ml-64">

        {/* TOPBAR */}

        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/10 bg-[#080a0d]/90 px-6 backdrop-blur-xl lg:px-10">

          <div>

            <h1 className="text-xl font-bold">
              Inicio
            </h1>

            <p className="text-sm text-gray-500">
              Resumen de tus finanzas
            </p>

          </div>

          <div className="flex items-center gap-3">

            <Link
              href="/perfil"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#27d59b] to-[#16b78a] font-bold text-[#032119] transition hover:scale-105"
            >

              {avatarDisplayUrl ? (
                <img
                  src={avatarDisplayUrl}
                  alt="Foto de perfil"
                  className="h-full w-full object-cover"
                />
              ) : (
                (
                  profile?.full_name?.charAt(0) ??
                  "U"
                ).toUpperCase()
              )}

            </Link>

            <Link
              href="/perfil"
              className="hidden sm:block"
            >

              <div className="text-sm font-bold">
                {profile?.full_name || "Usuario"}
              </div>

              <div className="text-xs text-gray-500">
                {profile?.email || ""}
              </div>

            </Link>

          </div>

        </header>

        <div className="p-6 lg:p-10">

          {/* SALUDO */}

          <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">

            <div>

              <div className="text-sm font-medium text-gray-500">
                RESUMEN FINANCIERO
              </div>

              <h2 className="mt-2 text-4xl font-black tracking-tight">
                ¡Hola, {profile?.full_name || "Usuario"}! 👋
              </h2>

              <p className="mt-2 text-gray-400">
                Acá tenés el resumen de tu dinero.
              </p>

            </div>

            <button
              onClick={openNewTransaction}
              className="rounded-xl bg-gradient-to-r from-[#27d59b] to-[#16b78a] px-6 py-3 font-extrabold text-[#032119] shadow-lg shadow-[#16b78a]/20 transition hover:brightness-110"
            >
              + Nuevo movimiento
            </button>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* ESTADÍSTICAS */}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="Balance total"
              value={money(balance)}
            />

            <StatCard
              title="Ingresos"
              value={money(totalIncome)}
              green
            />

            <StatCard
              title="Egresos"
              value={money(totalExpense)}
              red
            />

            <StatCard
              title="Movimientos"
              value={transactions.length.toString()}
            />

          </div>

          {/* ===========================
              GRÁFICO + CATEGORÍAS
          ============================ */}

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">

            {/* GRÁFICO DE TORTA */}

            <div className="rounded-2xl border border-gray-800 bg-[#111720] p-6">

              <div className="mb-6">

                <h3 className="font-bold">
                  Gastos por categoría
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Distribución de tus egresos
                </p>

              </div>

              {expenseCategories.length === 0 ? (

                <div className="flex h-64 items-center justify-center rounded-xl bg-[#0b1016]">

                  <div className="text-center">

                    <div className="text-4xl">
                      🐜
                    </div>

                    <p className="mt-3 font-semibold">
                      Todavía no tenés gastos
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Registrá un gasto para ver el gráfico.
                    </p>

                    <button
                      onClick={openNewTransaction}
                      className="mt-5 rounded-xl bg-[#27d59b] px-5 py-3 font-bold text-[#032119]"
                    >
                      Cargar gasto
                    </button>

                  </div>

                </div>

              ) : (

                <div className="rounded-xl bg-[#0b1016] p-5">

                  <PieChart data={expenseCategories} />

                </div>

              )}

            </div>

            {/* CATEGORÍAS */}

            <div className="rounded-2xl border border-gray-800 bg-[#111720] p-6">

              <div className="mb-5">

                <h3 className="font-bold">
                  Categorías
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Categorías disponibles
                </p>

              </div>

              {categories.length === 0 ? (

                <div className="text-sm text-gray-500">
                  No hay categorías disponibles.
                </div>

              ) : (

                <div className="space-y-1">

                  {categories
                    .slice(0, 10)
                    .map((category) => (

                      <div
                        key={category.id}
                        className="flex items-center justify-between border-b border-white/5 py-3"
                      >

                        <div className="flex items-center gap-3">

                          <span>
                            {category.icon || "📦"}
                          </span>

                          <span className="text-sm text-gray-300">
                            {category.name}
                          </span>

                        </div>

                        <span className="text-xs text-gray-500">
                          {category.type === "income"
                            ? "Ingreso"
                            : "Gasto"}
                        </span>

                      </div>

                    ))}

                </div>

              )}

            </div>

          </div>

          {/* HISTORIAL */}

          <div className="mt-5 rounded-2xl border border-gray-800 bg-[#111720] p-6">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h3 className="font-bold">
                  Últimos movimientos
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Registros reales de tu cuenta
                </p>

              </div>

              <Link
                href="/dashboard/historial"
                className="text-sm font-semibold text-[#27d59b] hover:underline"
              >
                Ver historial
              </Link>

            </div>

            {transactions.length === 0 ? (

              <div className="rounded-xl border border-dashed border-gray-800 p-10 text-center">

                <div className="text-4xl">
                  💸
                </div>

                <p className="mt-3 font-semibold">
                  No hay movimientos todavía
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Cargá tu primer ingreso o gasto.
                </p>

                <button
                  onClick={openNewTransaction}
                  className="mt-5 rounded-xl bg-[#27d59b] px-5 py-3 font-bold text-[#032119]"
                >
                  Cargar movimiento
                </button>

              </div>

            ) : (

              <div>

                {transactions
                  .slice(0, 8)
                  .map((transaction) => (

                    <div
                      key={transaction.id}
                      className="flex items-center justify-between border-b border-white/5 py-4 last:border-0"
                    >

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#202a35]">
                          {sourceIcon(transaction.source)}
                        </div>

                        <div>

                          <div className="text-sm font-semibold">
                            {transaction.description ||
                              "Sin descripción"}
                          </div>

                          <div className="mt-1 text-xs text-gray-500">

                            {getCategoryName(
                              transaction.category_id
                            )}

                            {" · "}

                            {formatDate(
                              transaction.transaction_date
                            )}

                            {" · "}

                            {sourceLabel(
                              transaction.source
                            )}

                          </div>

                        </div>

                      </div>

                      <div
                        className={`text-sm font-bold ${
                          transaction.type === "income"
                            ? "text-[#27d59b]"
                            : "text-red-400"
                        }`}
                      >

                        {transaction.type === "income"
                          ? "+"
                          : "-"}

                        {money(
                          Number(transaction.amount)
                        )}

                      </div>

                    </div>

                  ))}

              </div>

            )}

          </div>

          {/* FRASE */}

          <div className="mt-5 rounded-2xl border border-[#27d59b]/20 bg-[#27d59b]/5 p-6">

            <div className="flex items-center gap-4">

              <div className="text-4xl">
                🐜
              </div>

              <div>

                <p className="font-semibold italic text-gray-200">
                  “Las pequeñas decisiones de hoy construyen
                  tu GUITA de mañana.”
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  HormiGUITA
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ======================
          MODAL
      ======================= */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-3xl border border-gray-800 bg-[#111720] p-7">

            <div className="mb-7 flex items-start justify-between">

              <div>

                <h3 className="text-2xl font-black">
                  Nuevo movimiento
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Guardalo directamente en tu cuenta.
                </p>

              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-2xl text-gray-500 hover:text-white"
              >
                ×
              </button>

            </div>

            <div className="space-y-5">

              {/* TIPO */}

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Tipo
                </label>

                <select
                  value={type}
                  onChange={(e) => {
                    const newType =
                      e.target.value as
                        | "income"
                        | "expense";

                    setType(newType);
                    setCategoryId("");
                  }}
                  className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none"
                >

                  <option value="expense">
                    🔴 Egreso / Gasto
                  </option>

                  <option value="income">
                    🟢 Ingreso
                  </option>

                </select>

              </div>

              {/* DESCRIPCIÓN */}

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Descripción
                </label>

                <input
                  type="text"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Ej: Supermercado"
                  className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none focus:border-[#27d59b]"
                />

              </div>

              {/* MONTO */}

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Monto
                </label>

                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value)
                  }
                  placeholder="15000"
                  className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none focus:border-[#27d59b]"
                />

              </div>

              {/* CATEGORÍA */}

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Categoría
                </label>

                <select
                  value={categoryId}
                  onChange={(e) =>
                    setCategoryId(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none"
                >

                  <option value="">
                    Seleccioná una categoría
                  </option>

                  {currentCategories.map(
                    (category) => (

                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.icon || "📦"}{" "}
                        {category.name}
                      </option>

                    )
                  )}

                </select>

                {currentCategories.length === 0 && (
                  <p className="mt-2 text-xs text-red-400">
                    No hay categorías disponibles para este tipo.
                  </p>
                )}

              </div>

              {/* ORIGEN */}

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Origen del registro
                </label>

                <select
                  value={source}
                  onChange={(e) =>
                    setSource(
                      e.target.value as
                        | "manual"
                        | "whatsapp_text"
                        | "whatsapp_audio"
                    )
                  }
                  className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none"
                >

                  <option value="manual">
                    ✍️ Carga manual
                  </option>

                  <option value="whatsapp_text">
                    💬 Mensaje de WhatsApp
                  </option>

                  <option value="whatsapp_audio">
                    🎙️ Audio de WhatsApp
                  </option>

                </select>

              </div>

              {/* FECHA */}

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Fecha
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setDate(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none"
                />

              </div>

            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="mt-7 flex justify-end gap-3">

              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-gray-700 px-5 py-3 font-semibold text-gray-300 hover:bg-white/5"
              >
                Cancelar
              </button>

              <button
                onClick={saveTransaction}
                disabled={saving}
                className="rounded-xl bg-[#27d59b] px-5 py-3 font-extrabold text-[#032119] disabled:opacity-50"
              >
                {saving
                  ? "Guardando..."
                  : "Guardar movimiento"}
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}

function StatCard({
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