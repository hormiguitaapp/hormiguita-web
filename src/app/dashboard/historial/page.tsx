"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  name: string;
  type: "income" | "expense";
  icon: string | null;
};

function money(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function sourceLabel(source: Transaction["source"]) {
  if (source === "whatsapp_audio") return "🎙️ Audio";
  if (source === "whatsapp_text") return "💬 WhatsApp";
  return "✍️ Manual";
}

export default function HistorialPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "income" | "expense"
  >("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const [editing, setEditing] = useState<Transaction | null>(null);

  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] =
    useState<"income" | "expense">("expense");
  const [editCategory, setEditCategory] = useState("");
  const [editDate, setEditDate] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("No hay una sesión iniciada.");
      setLoading(false);
      return;
    }

    const [transactionsResult, categoriesResult] =
      await Promise.all([
        supabase
          .from("transactions")
          .select(
            "id, user_id, category_id, type, amount, description, source, transaction_date"
          )
          .eq("user_id", user.id)
          .order("transaction_date", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("categories")
          .select("id, name, type, icon")
          .eq("user_id", user.id)
          .order("name", {
            ascending: true,
          }),
      ]);

    if (transactionsResult.error) {
      setError(
        `Error al cargar movimientos: ${transactionsResult.error.message}`
      );
      setLoading(false);
      return;
    }

    if (categoriesResult.error) {
      setError(
        `Error al cargar categorías: ${categoriesResult.error.message}`
      );
      setLoading(false);
      return;
    }

    setTransactions(transactionsResult.data ?? []);
    setCategories(categoriesResult.data ?? []);
    setLoading(false);
  }

  function getCategoryName(categoryId: string | null) {
    if (!categoryId) return "Sin categoría";

    return (
      categories.find((category) => category.id === categoryId)
        ?.name ?? "Sin categoría"
    );
  }

  function getCategoryIcon(categoryId: string | null) {
    if (!categoryId) return "📦";

    return (
      categories.find((category) => category.id === categoryId)
        ?.icon ?? "📦"
    );
  }

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesType =
        filterType === "all" ||
        transaction.type === filterType;

      const matchesCategory =
        filterCategory === "all" ||
        transaction.category_id === filterCategory;

      const searchableText = `
        ${transaction.description ?? ""}
        ${getCategoryName(transaction.category_id)}
      `.toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      return (
        matchesType &&
        matchesCategory &&
        matchesSearch
      );
    });
  }, [
    transactions,
    categories,
    search,
    filterType,
    filterCategory,
  ]);

  function openEdit(transaction: Transaction) {
    setEditing(transaction);
    setEditDescription(transaction.description ?? "");
    setEditAmount(String(Number(transaction.amount)));
    setEditType(transaction.type);
    setEditCategory(transaction.category_id ?? "");
    setEditDate(transaction.transaction_date);
    setError("");
  }

  function closeEdit() {
    setEditing(null);
    setError("");
  }

  async function saveEdit() {
    if (!editing) return;

    setError("");

    if (!editDescription.trim()) {
      setError("La descripción no puede estar vacía.");
      return;
    }

    const numericAmount = Number(editAmount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Ingresá un monto válido.");
      return;
    }

    if (!editCategory) {
      setError("Seleccioná una categoría.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu sesión expiró.");
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        description: editDescription.trim(),
        amount: numericAmount,
        type: editType,
        category_id: editCategory,
        transaction_date: editDate,
      })
      .eq("id", editing.id)
      .eq("user_id", user.id);

    if (updateError) {
      setError(
        `No se pudo actualizar: ${updateError.message}`
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    closeEdit();

    await loadData();
  }

  async function deleteTransaction(
    transaction: Transaction
  ) {
    const confirmed = window.confirm(
      `¿Querés eliminar "${transaction.description ?? "este movimiento"}" por ${money(
        Number(transaction.amount)
      )}?`
    );

    if (!confirmed) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu sesión expiró.");
      return;
    }

    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transaction.id)
      .eq("user_id", user.id);

    if (deleteError) {
      setError(
        `No se pudo eliminar: ${deleteError.message}`
      );
      return;
    }

    await loadData();
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const editCategories = categories.filter(
    (category) => category.type === editType
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080a0d] text-white">
        <div className="text-center">
          <div className="mb-4 text-5xl">🐜</div>
          <p className="text-gray-400">
            Cargando historial...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080a0d] text-white">

      {/* SIDEBAR */}

      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-white/10 bg-[#0b1016] p-5 lg:block">

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

        <nav className="mt-10 space-y-2">

          <Link
            href="/dashboard"
            className="block rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            🏠 Inicio
          </Link>

          <div className="rounded-xl bg-[#27d59b]/10 px-4 py-3 font-semibold text-[#27d59b]">
            📋 Historial
          </div>

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

      {/* CONTENIDO */}

      <section className="lg:ml-64">

        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/10 bg-[#080a0d]/90 px-6 backdrop-blur-xl lg:px-10">

          <div>
            <h1 className="text-xl font-bold">
              Historial
            </h1>

            <p className="text-sm text-gray-500">
              Todos tus movimientos
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl bg-[#27d59b] px-4 py-2 text-sm font-bold text-[#032119]"
          >
            Volver
          </Link>

        </header>

        <div className="p-6 lg:p-10">

          {/* TÍTULO */}

          <div className="mb-8">
            <div className="text-sm font-medium text-gray-500">
              MOVIMIENTOS
            </div>

            <h2 className="mt-2 text-4xl font-black">
              Historial de tu GUITA
            </h2>

            <p className="mt-2 text-gray-400">
              Buscá, filtrá, editá o eliminá tus movimientos.
            </p>
          </div>

          {/* FILTROS */}

          <div className="mb-5 rounded-2xl border border-gray-800 bg-[#111720] p-5">

            <div className="grid gap-4 md:grid-cols-3">

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="🔎 Buscar movimiento..."
                className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none focus:border-[#27d59b]"
              />

              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(
                    e.target.value as
                      | "all"
                      | "income"
                      | "expense"
                  )
                }
                className="rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none"
              >
                <option value="all">
                  Todos los movimientos
                </option>

                <option value="income">
                  🟢 Ingresos
                </option>

                <option value="expense">
                  🔴 Gastos
                </option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) =>
                  setFilterCategory(e.target.value)
                }
                className="rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none"
              >

                <option value="all">
                  Todas las categorías
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.icon || "📦"}{" "}
                    {category.name}
                  </option>
                ))}

              </select>

            </div>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* TABLA */}

          <div className="overflow-hidden rounded-2xl border border-gray-800 bg-[#111720]">

            <div className="border-b border-white/5 px-6 py-5">

              <h3 className="font-bold">
                Movimientos encontrados
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                {filteredTransactions.length} registro
                {filteredTransactions.length === 1
                  ? ""
                  : "s"}
              </p>

            </div>

            {filteredTransactions.length === 0 ? (

              <div className="p-12 text-center">

                <div className="text-5xl">
                  🐜
                </div>

                <h3 className="mt-4 font-bold">
                  No encontramos movimientos
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Probá cambiar los filtros o cargar un movimiento.
                </p>

                <Link
                  href="/dashboard"
                  className="mt-5 inline-block rounded-xl bg-[#27d59b] px-5 py-3 font-bold text-[#032119]"
                >
                  Ir al dashboard
                </Link>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1000px]">

                  <thead>

                    <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-gray-500">

                      <th className="px-6 py-4">
                        Fecha
                      </th>

                      <th className="px-6 py-4">
                        Movimiento
                      </th>

                      <th className="px-6 py-4">
                        Categoría
                      </th>

                      <th className="px-6 py-4">
                        Origen
                      </th>

                      <th className="px-6 py-4">
                        Tipo
                      </th>

                      <th className="px-6 py-4">
                        Monto
                      </th>

                      <th className="px-6 py-4 text-right">
                        Acciones
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredTransactions.map(
                      (transaction) => (

                        <tr
                          key={transaction.id}
                          className="border-b border-white/5 transition hover:bg-white/[0.02]"
                        >

                          <td className="px-6 py-5 text-sm text-gray-400">
                            {formatDate(
                              transaction.transaction_date
                            )}
                          </td>

                          <td className="px-6 py-5">

                            <div className="font-semibold">
                              {transaction.description ||
                                "Sin descripción"}
                            </div>

                          </td>

                          <td className="px-6 py-5">

                            <span className="rounded-lg bg-[#0b1016] px-3 py-2 text-sm text-gray-300">
                              {getCategoryIcon(
                                transaction.category_id
                              )}{" "}
                              {getCategoryName(
                                transaction.category_id
                              )}
                            </span>

                          </td>

                          <td className="px-6 py-5 text-sm text-gray-400">
                            {sourceLabel(
                              transaction.source
                            )}
                          </td>

                          <td className="px-6 py-5">

                            {transaction.type ===
                            "income" ? (

                              <span className="rounded-full bg-[#27d59b]/10 px-3 py-1 text-xs font-bold text-[#27d59b]">
                                Ingreso
                              </span>

                            ) : (

                              <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
                                Gasto
                              </span>

                            )}

                          </td>

                          <td
                            className={`px-6 py-5 font-bold ${
                              transaction.type ===
                              "income"
                                ? "text-[#27d59b]"
                                : "text-red-400"
                            }`}
                          >
                            {transaction.type ===
                            "income"
                              ? "+"
                              : "-"}
                            {money(
                              Number(transaction.amount)
                            )}
                          </td>

                          <td className="px-6 py-5">

                            <div className="flex justify-end gap-2">

                              <button
                                onClick={() =>
                                  openEdit(
                                    transaction
                                  )
                                }
                                className="rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                              >
                                ✏️ Editar
                              </button>

                              <button
                                onClick={() =>
                                  deleteTransaction(
                                    transaction
                                  )
                                }
                                className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                              >
                                🗑️
                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      </section>

      {/* =========================
          MODAL EDITAR
      ========================== */}

      {editing && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-gray-800 bg-[#111720] p-7">

            <div className="mb-7 flex items-start justify-between">

              <div>
                <h3 className="text-2xl font-black">
                  Editar movimiento
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Modificá los datos del movimiento.
                </p>
              </div>

              <button
                onClick={closeEdit}
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
                  value={editType}
                  onChange={(e) => {
                    setEditType(
                      e.target.value as
                        | "income"
                        | "expense"
                    );
                    setEditCategory("");
                  }}
                  className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none"
                >

                  <option value="expense">
                    🔴 Gasto
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
                  value={editDescription}
                  onChange={(e) =>
                    setEditDescription(
                      e.target.value
                    )
                  }
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
                  value={editAmount}
                  onChange={(e) =>
                    setEditAmount(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none focus:border-[#27d59b]"
                />

              </div>

              {/* CATEGORÍA */}

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Categoría
                </label>

                <select
                  value={editCategory}
                  onChange={(e) =>
                    setEditCategory(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none"
                >

                  <option value="">
                    Seleccioná una categoría
                  </option>

                  {editCategories.map(
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

              </div>

              {/* FECHA */}

              <div>

                <label className="mb-2 block text-sm text-gray-300">
                  Fecha
                </label>

                <input
                  type="date"
                  value={editDate}
                  onChange={(e) =>
                    setEditDate(e.target.value)
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
                onClick={closeEdit}
                className="rounded-xl border border-gray-700 px-5 py-3 font-semibold text-gray-300 hover:bg-white/5"
              >
                Cancelar
              </button>

              <button
                onClick={saveEdit}
                disabled={saving}
                className="rounded-xl bg-[#27d59b] px-5 py-3 font-extrabold text-[#032119] disabled:opacity-50"
              >
                {saving
                  ? "Guardando..."
                  : "Guardar cambios"}
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}