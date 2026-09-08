"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
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
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    "es-AR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function sourceLabel(
  source: Transaction["source"]
) {
  if (source === "whatsapp_audio") {
    return "Audio";
  }

  if (source === "whatsapp_text") {
    return "WhatsApp";
  }

  return "Manual";
}

function SourceIcon({
  source,
}: {
  source: Transaction["source"];
}) {
  if (source === "whatsapp_audio") {
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
        <rect
          x="6"
          y="3"
          width="12"
          height="18"
          rx="6"
        />
        <path d="M9 11v2" />
        <path d="M12 9v6" />
        <path d="M15 11v2" />
      </svg>
    );
  }

  if (source === "whatsapp_text") {
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
        <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-4 3v-6.1A7.5 7.5 0 1 1 20 11.5Z" />
      </svg>
    );
  }

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
      <path d="M4 20h16" />
      <path d="M7 17V7.5a1.5 1.5 0 0 1 3 0V14" />
      <path d="M10 14V5.5a1.5 1.5 0 0 1 3 0V14" />
      <path d="M13 14V8a1.5 1.5 0 0 1 3 0v6" />
      <path d="M16 14v-2a1.5 1.5 0 0 1 3 0v3.5A4.5 4.5 0 0 1 14.5 20H9a5 5 0 0 1-5-5v-1" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

function SearchIcon() {
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
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="4"
        width="14"
        height="16"
        rx="2"
      />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

export default function HistorialPage() {
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filterType, setFilterType] =
    useState<
      "all" | "income" | "expense"
    >("all");

  const [filterCategory, setFilterCategory] =
    useState("all");

  const [editing, setEditing] =
    useState<Transaction | null>(null);

  const [editDescription, setEditDescription] =
    useState("");

  const [editAmount, setEditAmount] =
    useState("");

  const [editType, setEditType] =
    useState<"income" | "expense">(
      "expense"
    );

  const [editCategory, setEditCategory] =
    useState("");

  const [editDate, setEditDate] =
    useState("");

  const [saving, setSaving] =
    useState(false);

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
      setError(
        "No hay una sesión iniciada."
      );
      setLoading(false);
      return;
    }

    const [
      transactionsResult,
      categoriesResult,
    ] = await Promise.all([
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
        .select(
          "id, name, type, icon"
        )
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

    setTransactions(
      transactionsResult.data ?? []
    );

    setCategories(
      categoriesResult.data ?? []
    );

    setLoading(false);
  }

  function getCategoryName(
    categoryId: string | null
  ) {
    if (!categoryId) {
      return "Sin categoría";
    }

    return (
      categories.find(
        (category) =>
          category.id === categoryId
      )?.name ?? "Sin categoría"
    );
  }

  const filteredTransactions =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      return transactions.filter(
        (transaction) => {
          const matchesType =
            filterType === "all" ||
            transaction.type ===
              filterType;

          const matchesCategory =
            filterCategory === "all" ||
            transaction.category_id ===
              filterCategory;

          const searchableText = `
            ${transaction.description ?? ""}
            ${getCategoryName(
              transaction.category_id
            )}
          `.toLowerCase();

          const matchesSearch =
            !query ||
            searchableText.includes(
              query
            );

          return (
            matchesType &&
            matchesCategory &&
            matchesSearch
          );
        }
      );
    }, [
      transactions,
      categories,
      search,
      filterType,
      filterCategory,
    ]);

  function openEdit(
    transaction: Transaction
  ) {
    setEditing(transaction);
    setEditDescription(
      transaction.description ?? ""
    );
    setEditAmount(
      String(Number(transaction.amount))
    );
    setEditType(transaction.type);
    setEditCategory(
      transaction.category_id ?? ""
    );
    setEditDate(
      transaction.transaction_date
    );
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
      setError(
        "La descripción no puede estar vacía."
      );
      return;
    }

    const numericAmount =
      Number(editAmount);

    if (
      !numericAmount ||
      numericAmount <= 0
    ) {
      setError(
        "Ingresá un monto válido."
      );
      return;
    }

    if (!editCategory) {
      setError(
        "Seleccioná una categoría."
      );
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

    const {
      error: updateError,
    } = await supabase
      .from("transactions")
      .update({
        description:
          editDescription.trim(),
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
    const confirmed =
      window.confirm(
        `¿Querés eliminar "${
          transaction.description ??
          "este movimiento"
        }" por ${money(
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

    const {
      error: deleteError,
    } = await supabase
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

  const editCategories =
    categories.filter(
      (category) =>
        category.type === editType
    );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080a0d] text-white">
        <div className="text-center">

          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#27d59b]/20 bg-[#27d59b]/10 text-[#27d59b]">
            <span className="h-3 w-3 animate-pulse rounded-full bg-[#27d59b]" />
          </div>

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

      <Sidebar
        active="historial"
        onLogout={logout}
      />

      {/* CONTENIDO */}

      <section className="lg:ml-64">

        {/* TOPBAR */}

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
            className="rounded-xl bg-[#27d59b] px-4 py-2 text-sm font-bold text-[#032119] transition hover:brightness-110"
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

              {/* BUSCADOR */}

              <div className="relative">

                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <SearchIcon />
                </div>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Buscar movimiento..."
                  className="w-full rounded-xl border border-gray-700 bg-[#0b1016] py-3 pl-11 pr-4 text-white outline-none focus:border-[#27d59b]"
                />

              </div>

              {/* TIPO */}

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
                  Ingresos
                </option>

                <option value="expense">
                  Gastos
                </option>

              </select>

              {/* CATEGORÍA */}

              <select
                value={filterCategory}
                onChange={(e) =>
                  setFilterCategory(
                    e.target.value
                  )
                }
                className="rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none"
              >

                <option value="all">
                  Todas las categorías
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  )
                )}

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
                {
                  filteredTransactions.length
                }{" "}
                registro
                {filteredTransactions.length ===
                1
                  ? ""
                  : "s"}
              </p>

            </div>

            {filteredTransactions.length ===
            0 ? (

              <div className="p-12 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-800 bg-[#0b1016] text-gray-500">
                  <EmptyIcon />
                </div>

                <h3 className="mt-4 font-bold">
                  No encontramos movimientos
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Probá cambiar los filtros o cargar un movimiento.
                </p>

                <Link
                  href="/dashboard"
                  className="mt-5 inline-block rounded-xl bg-[#27d59b] px-5 py-3 font-bold text-[#032119] transition hover:brightness-110"
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
                          key={
                            transaction.id
                          }
                          className="border-b border-white/5 transition hover:bg-white/[0.02]"
                        >

                          <td className="px-6 py-5 text-sm text-gray-400">
                            {formatDate(
                              transaction.transaction_date
                            )}
                          </td>

                          <td className="px-6 py-5">

                            <div className="font-semibold">
                              {
                                transaction.description ||
                                "Sin descripción"
                              }
                            </div>

                          </td>

                          <td className="px-6 py-5">

                            <span className="rounded-lg bg-[#0b1016] px-3 py-2 text-sm text-gray-300">
                              {
                                getCategoryName(
                                  transaction.category_id
                                )
                              }
                            </span>

                          </td>

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-2 text-sm text-gray-400">

                              <span className="text-gray-500">
                                <SourceIcon
                                  source={
                                    transaction.source
                                  }
                                />
                              </span>

                              <span>
                                {sourceLabel(
                                  transaction.source
                                )}
                              </span>

                            </div>

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
                              Number(
                                transaction.amount
                              )
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
                                className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                              >
                                <EditIcon />
                                <span>
                                  Editar
                                </span>
                              </button>

                              <button
                                onClick={() =>
                                  deleteTransaction(
                                    transaction
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 transition hover:bg-red-500/10"
                                aria-label="Eliminar movimiento"
                                title="Eliminar movimiento"
                              >
                                <TrashIcon />
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
                className="text-2xl text-gray-500 transition hover:text-white"
                aria-label="Cerrar"
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
                    Gasto
                  </option>

                  <option value="income">
                    Ingreso
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
                    setEditAmount(
                      e.target.value
                    )
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
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {
                          category.name
                        }
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
                    setEditDate(
                      e.target.value
                    )
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
                className="rounded-xl border border-gray-700 px-5 py-3 font-semibold text-gray-300 transition hover:bg-white/5"
              >
                Cancelar
              </button>

              <button
                onClick={saveEdit}
                disabled={saving}
                className="rounded-xl bg-[#27d59b] px-5 py-3 font-extrabold text-[#032119] transition hover:brightness-110 disabled:opacity-50"
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