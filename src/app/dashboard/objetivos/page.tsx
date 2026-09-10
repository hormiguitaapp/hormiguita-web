"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import { createClient } from "@/lib/supabase/client";

type Currency = "ARS" | "USD";
type Plan = "free" | "pro";
type AmountMode = "ARS" | "USD";

type Goal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number | null;
  current_amount_ars: number;
  currency: Currency;
  deadline: string | null;
  created_at: string;
  updated_at: string;
};

type GoalForm = {
  name: string;
  target_amount: string;
  currency: Currency;
  deadline: string;
};

type ExchangeRate = {
  currency: "USD";
  type: "official_sell";
  rate: number;
  source: string;
  sourceName: string;
  updatedAt: string;
};

function formatARS(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatUSD(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMoney(
  value: number,
  currency: Currency
) {
  return currency === "USD"
    ? formatUSD(value)
    : formatARS(value);
}

function formatDate(date: string | null) {
  if (!date) {
    return "Sin fecha límite";
  }

  const [year, month, day] = date.split("-");

  return `${day}/${month}/${year}`;
}

function formatExchangeRateDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function calculateProgress(
  current: number,
  target: number
) {
  if (target <= 0) {
    return 0;
  }

  return Math.min(
    (current / target) * 100,
    100
  );
}

export default function ObjetivosPage() {
  const supabase = createClient();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] =
    useState<string | null>(null);

  const [plan, setPlan] =
    useState<Plan>("free");

  const [exchangeRate, setExchangeRate] =
    useState<ExchangeRate | null>(null);

  const [exchangeRateLoading, setExchangeRateLoading] =
    useState(false);

  const [exchangeRateError, setExchangeRateError] =
    useState(false);

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showAddMoneyModal, setShowAddMoneyModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [showUpgradeModal, setShowUpgradeModal] =
    useState(false);

  const [selectedGoal, setSelectedGoal] =
    useState<Goal | null>(null);

  const [form, setForm] =
    useState<GoalForm>({
      name: "",
      target_amount: "",
      currency: "ARS",
      deadline: "",
    });

  const [initialAmount, setInitialAmount] =
    useState("");

  const [initialAmountMode, setInitialAmountMode] =
    useState<AmountMode>("ARS");

  const [amountToAdd, setAmountToAdd] =
    useState("");

  const [addMoneyMode, setAddMoneyMode] =
    useState<AmountMode>("ARS");

  const [editSavingsAmount, setEditSavingsAmount] =
    useState("");

  const [editSavingsMode, setEditSavingsMode] =
    useState<AmountMode>("ARS");

  const [saving, setSaving] =
    useState(false);

  const maxGoals =
    plan === "pro" ? 5 : 1;

  const canCreateGoal =
    goals.length < maxGoals;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.href = "/login";
      return;
    }

    setUserId(user.id);

    await Promise.all([
      loadGoals(user.id),
      loadSubscription(user.id),
      loadExchangeRate(),
    ]);

    setLoading(false);
  }

  async function loadGoals(
    currentUserId?: string
  ) {
    const id = currentUserId ?? userId;

    if (!id) {
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Error cargando objetivos:",
        error
      );

      setGoals([]);
      return;
    }

    setGoals(data ?? []);
  }

  async function loadSubscription(
    currentUserId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", currentUserId)
      .maybeSingle();

    if (error) {
      console.error(
        "Error cargando suscripción:",
        error
      );

      setPlan("free");
      return;
    }

    setPlan(
      data?.plan === "pro"
        ? "pro"
        : "free"
    );
  }

  async function loadExchangeRate() {
    setExchangeRateLoading(true);
    setExchangeRateError(false);

    try {
      const response =
        await fetch(
          "/api/exchange-rate",
          {
            cache: "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          "No se pudo obtener la cotización."
        );
      }

      const data =
        (await response.json()) as ExchangeRate;

      if (
        data.currency !== "USD" ||
        data.type !==
          "official_sell" ||
        typeof data.rate !==
          "number"
      ) {
        throw new Error(
          "Cotización inválida."
        );
      }

      setExchangeRate(data);
    } catch (error) {
      console.error(
        "Error obteniendo cotización:",
        error
      );

      setExchangeRate(null);
      setExchangeRateError(true);
    } finally {
      setExchangeRateLoading(false);
    }
  }

  function logout() {
    window.location.href = "/login";
  }

  function closeAllModals() {
    setShowCreateModal(false);
    setShowAddMoneyModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);

    setSelectedGoal(null);

    setForm({
      name: "",
      target_amount: "",
      currency: "ARS",
      deadline: "",
    });

    setInitialAmount("");
    setInitialAmountMode("ARS");

    setAmountToAdd("");
    setAddMoneyMode("ARS");

    setEditSavingsAmount("");
    setEditSavingsMode("ARS");

    setSaving(false);
  }

  function openCreateModal() {
    if (!canCreateGoal) {
      setShowUpgradeModal(true);
      return;
    }

    setForm({
      name: "",
      target_amount: "",
      currency: "ARS",
      deadline: "",
    });

    setInitialAmount("");
    setInitialAmountMode("ARS");

    setShowCreateModal(true);
  }

  function getCurrentARS(goal: Goal) {
    return (
      Number(
        goal.current_amount_ars
      ) || 0
    );
  }

  function getCurrentUSD(goal: Goal) {
    if (!exchangeRate) {
      return null;
    }

    return (
      getCurrentARS(goal) /
      exchangeRate.rate
    );
  }

  function getGoalProgress(goal: Goal) {
    if (goal.currency === "ARS") {
      return calculateProgress(
        getCurrentARS(goal),
        Number(
          goal.target_amount
        )
      );
    }

    const currentUSD =
      getCurrentUSD(goal);

    if (
      currentUSD === null
    ) {
      return null;
    }

    return calculateProgress(
      currentUSD,
      Number(
        goal.target_amount
      )
    );
  }

  function getTargetARS(goal: Goal) {
    if (
      goal.currency !== "USD" ||
      !exchangeRate
    ) {
      return null;
    }

    return (
      Number(
        goal.target_amount
      ) * exchangeRate.rate
    );
  }

  async function createGoal() {
    if (!userId) {
      return;
    }

    if (!canCreateGoal) {
      setShowCreateModal(false);
      setShowUpgradeModal(true);
      return;
    }

    if (
      form.currency === "USD" &&
      plan !== "pro"
    ) {
      setShowCreateModal(false);
      setShowUpgradeModal(true);
      return;
    }

    const name =
      form.name.trim();

    const targetAmount =
      Number(
        form.target_amount
      );

    if (!name) {
      alert(
        "Ingresá un nombre para el objetivo."
      );
      return;
    }

    if (
      !Number.isFinite(
        targetAmount
      ) ||
      targetAmount <= 0
    ) {
      alert(
        "Ingresá un monto objetivo válido."
      );
      return;
    }

    let initialARS = 0;

    if (
      initialAmount.trim() !== ""
    ) {
      const amount =
        Number(
          initialAmount
        );

      if (
        !Number.isFinite(
          amount
        ) ||
        amount < 0
      ) {
        alert(
          "Ingresá un monto inicial válido."
        );
        return;
      }

      if (
        form.currency === "USD" &&
        initialAmountMode === "USD"
      ) {
        if (!exchangeRate) {
          alert(
            "No tenemos disponible la cotización del dólar."
          );
          return;
        }

        initialARS =
          amount *
          exchangeRate.rate;
      } else {
        initialARS = amount;
      }
    }

    setSaving(true);

    const {
      error,
    } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        name,
        target_amount:
          targetAmount,
        current_amount: 0,
        current_amount_ars:
          initialARS,
        currency:
          form.currency,
        deadline:
          form.deadline ||
          null,
      });

    if (error) {
      console.error(
        "Error creando objetivo:",
        error
      );

      if (
        error.message.includes(
          "requieren HormiGUITA Pro"
        ) ||
        error.message.includes(
          "límite de objetivos"
        )
      ) {
        setShowCreateModal(false);
        setShowUpgradeModal(true);
      } else {
        alert(
          "No se pudo crear el objetivo."
        );
      }

      setSaving(false);
      return;
    }

    await loadGoals();

    closeAllModals();
  }

  function openAddMoneyModal(
    goal: Goal
  ) {
    setSelectedGoal(goal);

    setAmountToAdd("");

    setAddMoneyMode(
      goal.currency === "USD"
        ? "ARS"
        : "ARS"
    );

    setShowAddMoneyModal(true);
  }

  async function addMoney() {
    if (!selectedGoal) {
      return;
    }

    const amount =
      Number(amountToAdd);

    if (
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      alert(
        "Ingresá un monto válido."
      );
      return;
    }

    let amountARS =
      amount;

    if (
      selectedGoal.currency ===
      "USD"
    ) {
      if (!exchangeRate) {
        alert(
          "No tenemos disponible la cotización del dólar."
        );
        return;
      }

      if (
        addMoneyMode ===
        "USD"
      ) {
        amountARS =
          amount *
          exchangeRate.rate;
      }
    }

    const currentARS =
      getCurrentARS(
        selectedGoal
      );

    const newAmountARS =
      currentARS +
      amountARS;

    setSaving(true);

    const {
      error,
    } = await supabase
      .from("goals")
      .update({
        current_amount_ars:
          newAmountARS,
        current_amount: 0,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        selectedGoal.id
      )
      .eq(
        "user_id",
        selectedGoal.user_id
      );

    if (error) {
      console.error(
        "Error agregando dinero:",
        error
      );

      alert(
        "No se pudo actualizar el objetivo."
      );

      setSaving(false);
      return;
    }

    await loadGoals();

    closeAllModals();
  }

  function openEditModal(
    goal: Goal
  ) {
    setSelectedGoal(goal);

    setForm({
      name: goal.name,
      target_amount:
        String(
          goal.target_amount
        ),
      currency:
        goal.currency,
      deadline:
        goal.deadline ??
        "",
    });

    setEditSavingsMode("ARS");

    setEditSavingsAmount(
      String(
        getCurrentARS(goal)
      )
    );

    setShowEditModal(true);
  }

  async function editGoal() {
    if (!selectedGoal) {
      return;
    }

    const name =
      form.name.trim();

    const targetAmount =
      Number(
        form.target_amount
      );

    if (!name) {
      alert(
        "Ingresá un nombre para el objetivo."
      );
      return;
    }

    if (
      !Number.isFinite(
        targetAmount
      ) ||
      targetAmount <= 0
    ) {
      alert(
        "Ingresá un monto objetivo válido."
      );
      return;
    }

    if (
      form.currency === "USD" &&
      plan !== "pro"
    ) {
      setShowEditModal(false);
      setShowUpgradeModal(true);
      return;
    }

    const currentARS =
      getCurrentARS(
        selectedGoal
      );

    let savingsARS =
      Number(
        editSavingsAmount
      );

    if (
      editSavingsAmount.trim() ===
      ""
    ) {
      savingsARS =
        currentARS;
    }

    if (
      !Number.isFinite(
        savingsARS
      ) ||
      savingsARS < 0
    ) {
      alert(
        "Ingresá un ahorro acumulado válido."
      );
      return;
    }

    if (
      editSavingsMode ===
      "USD"
    ) {
      if (!exchangeRate) {
        alert(
          "No tenemos disponible la cotización del dólar."
        );
        return;
      }

      savingsARS =
        savingsARS *
        exchangeRate.rate;
    }

    setSaving(true);

    const {
      error,
    } = await supabase
      .from("goals")
      .update({
        name,
        target_amount:
          targetAmount,
        current_amount: 0,
        current_amount_ars:
          savingsARS,
        currency:
          form.currency,
        deadline:
          form.deadline ||
          null,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        selectedGoal.id
      )
      .eq(
        "user_id",
        selectedGoal.user_id
      );

    if (error) {
      console.error(
        "Error editando objetivo:",
        error
      );

      if (
        error.message.includes(
          "requieren HormiGUITA Pro"
        )
      ) {
        setShowEditModal(false);
        setShowUpgradeModal(true);
      } else {
        alert(
          "No se pudo editar el objetivo."
        );
      }

      setSaving(false);
      return;
    }

    await loadGoals();

    closeAllModals();
  }

  function openDeleteModal(
    goal: Goal
  ) {
    setSelectedGoal(goal);
    setShowDeleteModal(true);
  }

  async function deleteGoal() {
    if (!selectedGoal) {
      return;
    }

    setSaving(true);

    const {
      error,
    } = await supabase
      .from("goals")
      .delete()
      .eq(
        "id",
        selectedGoal.id
      )
      .eq(
        "user_id",
        selectedGoal.user_id
      );

    if (error) {
      console.error(
        "Error eliminando objetivo:",
        error
      );

      alert(
        "No se pudo eliminar el objetivo."
      );

      setSaving(false);
      return;
    }

    await loadGoals();

    closeAllModals();
  }

  function getInitialPreview() {
    const amount =
      Number(
        initialAmount
      ) || 0;

    if (
      form.currency ===
      "USD"
    ) {
      if (
        initialAmountMode ===
        "USD"
      ) {
        return formatUSD(
          amount
        );
      }

      if (
        exchangeRate
      ) {
        return formatUSD(
          amount /
            exchangeRate.rate
        );
      }

      return "—";
    }

    return formatARS(
      amount
    );
  }

  function getAddMoneyPreview() {
    const amount =
      Number(
        amountToAdd
      ) || 0;

    if (
      selectedGoal?.currency !==
      "USD"
    ) {
      return formatARS(
        amount
      );
    }

    if (
      !exchangeRate
    ) {
      return "—";
    }

    if (
      addMoneyMode ===
      "USD"
    ) {
      return formatARS(
        amount *
          exchangeRate.rate
      );
    }

    return formatUSD(
      amount /
        exchangeRate.rate
    );
  }

  function getEditSavingsPreview() {
    const amount =
      Number(
        editSavingsAmount
      ) || 0;

    if (
      form.currency !==
      "USD"
    ) {
      return formatARS(
        amount
      );
    }

    if (
      !exchangeRate
    ) {
      return "—";
    }

    if (
      editSavingsMode ===
      "USD"
    ) {
      return formatARS(
        amount *
          exchangeRate.rate
      );
    }

    return formatUSD(
      amount /
        exchangeRate.rate
    );
  }

  return (
    <main className="min-h-screen bg-[#080a0d] text-white">
      <Sidebar
        active="objetivos"
        onLogout={
          logout
        }
      />

      <section className="lg:ml-64">
        <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between border-b border-white/10 bg-[#080a0d]/90 px-6 py-4 backdrop-blur-xl lg:px-10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">
                Objetivos
              </h1>

              <span className="rounded-full border border-gray-800 bg-[#111720] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                {plan ===
                "pro"
                  ? "Pro"
                  : "Free"}
              </span>
            </div>

            <p className="text-sm text-gray-500">
              Metas para tu dinero
            </p>
          </div>

          <button
            onClick={
              openCreateModal
            }
            className="rounded-xl bg-[#27d59b] px-4 py-2 text-sm font-bold text-[#07110d] transition hover:brightness-110"
          >
            + Nuevo objetivo
          </button>
        </header>

        <div className="p-6 lg:p-10">
          <div className="mx-auto w-full max-w-7xl">

            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-3xl font-black tracking-tight">
                  Tus objetivos
                </h2>

                <p className="mt-2 text-gray-500">
                  Definí una meta, empezá desde cero y construí tu progreso.
                </p>
              </div>

              <div className="text-sm text-gray-600">
                {goals.length}{" "}
                /{" "}
                {maxGoals}{" "}
                objetivos
              </div>
            </div>

            {exchangeRateLoading && (
              <div className="mb-6 rounded-2xl border border-gray-800 bg-[#111720] px-5 py-4">
                <p className="text-sm text-gray-500">
                  Actualizando cotización del dólar...
                </p>
              </div>
            )}

            {exchangeRateError && (
              <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-gray-400">
                    No pudimos actualizar la cotización del dólar.
                  </p>

                  <button
                    onClick={
                      loadExchangeRate
                    }
                    className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-white/5"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {plan ===
              "free" && (
              <div className="mb-6 rounded-2xl border border-[#27d59b]/15 bg-[#27d59b]/5 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white">
                      Estás usando HormiGUITA Free
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Tenés 1 objetivo disponible. Pro permite hasta 5 y objetivos en USD.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setShowUpgradeModal(
                        true
                      )
                    }
                    className="rounded-lg border border-[#27d59b]/30 px-3 py-2 text-xs font-bold text-[#27d59b] transition hover:bg-[#27d59b]/10"
                  >
                    Conocer Pro
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="rounded-3xl border border-gray-800 bg-[#111720] p-10 text-center">
                <p className="text-gray-500">
                  Cargando objetivos...
                </p>
              </div>
            ) : goals.length ===
              0 ? (
              <div className="rounded-3xl border border-gray-800 bg-[#111720] p-10 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#27d59b]/20 bg-[#27d59b]/10 text-[#27d59b]">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="8"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="4"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="1"
                    />
                  </svg>
                </div>

                <h3 className="mt-6 text-2xl font-black">
                  Todavía no tenés objetivos
                </h3>

                <p className="mx-auto mt-3 max-w-lg text-gray-500">
                  Creá tu primera meta de ahorro y empezá a construirla desde $0.
                </p>

                <button
                  onClick={
                    openCreateModal
                  }
                  className="mt-7 rounded-xl bg-[#27d59b] px-5 py-3 text-sm font-bold text-[#07110d] transition hover:brightness-110"
                >
                  Crear mi primer objetivo
                </button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {goals.map(
                  (goal) => {
                    const currentARS =
                      getCurrentARS(
                        goal
                      );

                    const currentUSD =
                      getCurrentUSD(
                        goal
                      );

                    const progress =
                      getGoalProgress(
                        goal
                      );

                    const target =
                      Number(
                        goal.target_amount
                      );

                    let remaining:
                      | number
                      | null =
                      null;

                    if (
                      goal.currency ===
                      "ARS"
                    ) {
                      remaining =
                        Math.max(
                          target -
                            currentARS,
                          0
                        );
                    } else if (
                      currentUSD !==
                      null
                    ) {
                      remaining =
                        Math.max(
                          target -
                            currentUSD,
                          0
                        );
                    }

                    const completed =
                      progress !==
                        null &&
                      progress >=
                        100;

                    const targetARS =
                      getTargetARS(
                        goal
                      );

                    return (
                      <article
                        key={
                          goal.id
                        }
                        className="rounded-3xl border border-gray-800 bg-[#111720] p-6"
                      >
                        <div className="flex items-start justify-between gap-4">

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">

                              <h3 className="truncate text-lg font-bold">
                                {
                                  goal.name
                                }
                              </h3>

                              <span className="rounded-full border border-gray-700 bg-[#0b1016] px-2 py-1 text-[10px] font-bold text-gray-400">
                                {
                                  goal.currency
                                }
                              </span>

                            </div>

                            <p className="mt-1 text-sm text-gray-500">
                              {formatDate(
                                goal.deadline
                              )}
                            </p>
                          </div>

                          <div className="flex gap-2">

                            <button
                              onClick={() =>
                                openEditModal(
                                  goal
                                )
                              }
                              className="rounded-lg border border-gray-800 px-3 py-2 text-xs text-gray-400 transition hover:bg-white/5 hover:text-white"
                            >
                              Editar
                            </button>

                            <button
                              onClick={() =>
                                openDeleteModal(
                                  goal
                                )
                              }
                              className="rounded-lg border border-gray-800 px-3 py-2 text-xs text-gray-400 transition hover:bg-white/5 hover:text-red-400"
                            >
                              Eliminar
                            </button>

                          </div>
                        </div>

                        <div className="mt-7">

                          <div className="flex items-end justify-between gap-4">

                            <div>

                              {goal.currency ===
                                "USD" &&
                              currentUSD !==
                                null ? (
                                <>
                                  <p className="text-2xl font-black">
                                    {formatUSD(
                                      currentUSD
                                    )}
                                  </p>

                                  <p className="mt-1 text-sm text-gray-500">
                                    de{" "}
                                    {formatUSD(
                                      target
                                    )}
                                  </p>

                                  <p className="mt-1 text-xs text-gray-600">
                                    Ahorro real:{" "}
                                    {formatARS(
                                      currentARS
                                    )}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-2xl font-black">
                                    {formatARS(
                                      currentARS
                                    )}
                                  </p>

                                  <p className="mt-1 text-sm text-gray-500">
                                    de{" "}
                                    {formatARS(
                                      target
                                    )}
                                  </p>
                                </>
                              )}

                            </div>

                            <p className="text-sm font-bold text-[#27d59b]">
                              {progress ===
                              null
                                ? "—"
                                : `${progress.toFixed(
                                    1
                                  )}%`}
                            </p>

                          </div>

                          <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#0b1016]">
                            <div
                              className="h-full rounded-full bg-[#27d59b] transition-all duration-500"
                              style={{
                                width: `${
                                  progress ??
                                  0
                                }%`,
                              }}
                            />
                          </div>

                          <p className="mt-3 text-sm text-gray-500">
                            {completed
                              ? "Objetivo cumplido."
                              : remaining !==
                                null
                              ? `Faltan ${
                                  goal.currency ===
                                  "USD"
                                    ? formatUSD(
                                        remaining
                                      )
                                    : formatARS(
                                        remaining
                                      )
                                }`
                              : "Cotización no disponible."}
                          </p>

                          {goal.currency ===
                            "USD" && (
                            <div className="mt-5 rounded-2xl border border-gray-800 bg-[#0b1016] p-4">

                              {exchangeRate ? (
                                <>
                                  <p className="text-xs uppercase tracking-wide text-gray-600">
                                    Equivalente aproximado en pesos
                                  </p>

                                  <p className="mt-1 text-lg font-bold text-white">
                                    {formatARS(
                                      targetARS ??
                                        0
                                    )}
                                  </p>

                                  <p className="mt-2 text-xs text-gray-500">
                                    Dólar venta:{" "}
                                    {formatARS(
                                      exchangeRate.rate
                                    )}{" "}
                                    por USD
                                  </p>

                                  <p className="mt-1 text-xs text-gray-600">
                                    Actualizado:{" "}
                                    {formatExchangeRateDate(
                                      exchangeRate.updatedAt
                                    )}
                                  </p>

                                  <div className="mt-3 border-t border-gray-800 pt-3">
                                    <p className="text-xs text-gray-600">
                                      Ahorrado en pesos
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-300">
                                      {formatARS(
                                        currentARS
                                      )}
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <p className="text-sm text-gray-600">
                                  Equivalente en pesos no disponible.
                                </p>
                              )}

                            </div>
                          )}

                        </div>

                        <button
                          onClick={() =>
                            openAddMoneyModal(
                              goal
                            )
                          }
                          disabled={
                            completed
                          }
                          className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-bold transition ${
                            completed
                              ? "cursor-not-allowed border border-gray-800 bg-[#0b1016] text-gray-600"
                              : "bg-[#27d59b] text-[#07110d] hover:brightness-110"
                          }`}
                        >
                          {completed
                            ? "Objetivo completado"
                            : "+ Agregar dinero"}
                        </button>

                      </article>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {showCreateModal && (
        <Modal
          title="Crear objetivo"
          onClose={
            closeAllModals
          }
        >
          <div className="space-y-5">

            <Field label="Nombre del objetivo">
              <input
                value={
                  form.name
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                placeholder="Ej: Comprar una moto"
                className="w-full rounded-xl border border-gray-800 bg-[#0b1016] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#27d59b]"
              />
            </Field>

            <Field label="Moneda del objetivo">
              <div className="grid grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      currency:
                        "ARS",
                    })
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    form.currency ===
                    "ARS"
                      ? "border-[#27d59b] bg-[#27d59b]/10 text-[#27d59b]"
                      : "border-gray-800 bg-[#0b1016] text-gray-400 hover:bg-white/5"
                  }`}
                >
                  $ ARS
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      plan !==
                      "pro"
                    ) {
                      setShowUpgradeModal(
                        true
                      );
                      return;
                    }

                    setForm({
                      ...form,
                      currency:
                        "USD",
                    });
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    form.currency ===
                      "USD" &&
                    plan ===
                      "pro"
                      ? "border-[#27d59b] bg-[#27d59b]/10 text-[#27d59b]"
                      : "border-gray-800 bg-[#0b1016] text-gray-400 hover:bg-white/5"
                  }`}
                >
                  US$ USD

                  {plan !==
                    "pro" && (
                    <span className="ml-2 text-[10px] text-[#27d59b]">
                      PRO
                    </span>
                  )}
                </button>

              </div>
            </Field>

            <Field label="Monto objetivo">
              <input
                type="number"
                min="1"
                step="0.01"
                value={
                  form.target_amount
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    target_amount:
                      e.target.value,
                  })
                }
                placeholder={
                  form.currency ===
                  "USD"
                    ? "13000"
                    : "3500000"
                }
                className="w-full rounded-xl border border-gray-800 bg-[#0b1016] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#27d59b]"
              />
            </Field>

            {form.currency ===
              "USD" && (
              <div className="rounded-2xl border border-gray-800 bg-[#0b1016] p-4">

                {exchangeRate ? (
                  <>
                    <p className="text-xs uppercase tracking-wide text-gray-600">
                      Equivalente aproximado en pesos
                    </p>

                    <p className="mt-1 text-xl font-black">
                      {Number(
                        form.target_amount
                      ) > 0
                        ? formatARS(
                            Number(
                              form.target_amount
                            ) *
                              exchangeRate.rate
                          )
                        : "$0"}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      Dólar venta:{" "}
                      {formatARS(
                        exchangeRate.rate
                      )}{" "}
                      por USD
                    </p>

                    <p className="mt-1 text-xs text-gray-600">
                      Actualizado:{" "}
                      {formatExchangeRateDate(
                        exchangeRate.updatedAt
                      )}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">
                    Cotización no disponible.
                  </p>
                )}

              </div>
            )}

            <Field label="Monto inicial">
              {form.currency ===
                "USD" && (
                <div className="mb-3 grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setInitialAmountMode(
                        "ARS"
                      )
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                      initialAmountMode ===
                      "ARS"
                        ? "border-[#27d59b] bg-[#27d59b]/10 text-[#27d59b]"
                        : "border-gray-800 bg-[#0b1016] text-gray-400 hover:bg-white/5"
                    }`}
                  >
                    $ ARS
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setInitialAmountMode(
                        "USD"
                      )
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                      initialAmountMode ===
                      "USD"
                        ? "border-[#27d59b] bg-[#27d59b]/10 text-[#27d59b]"
                        : "border-gray-800 bg-[#0b1016] text-gray-400 hover:bg-white/5"
                    }`}
                  >
                    US$ USD
                  </button>

                </div>
              )}

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  initialAmount
                }
                onChange={(e) =>
                  setInitialAmount(
                    e.target.value
                  )
                }
                placeholder="0"
                className="w-full rounded-xl border border-gray-800 bg-[#0b1016] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#27d59b]"
              />

              {form.currency ===
                "USD" &&
                initialAmount && (
                  <div className="mt-3 rounded-xl border border-gray-800 bg-[#0b1016] p-3">

                    <p className="text-xs text-gray-500">
                      Valor inicial convertido
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-300">
                      {getInitialPreview()}
                    </p>

                  </div>
                )}

              <p className="mt-2 text-xs text-gray-600">
                Podés dejarlo en 0 y modificarlo después.
              </p>
            </Field>

            <Field label="Fecha límite (opcional)">
              <input
                type="date"
                value={
                  form.deadline
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    deadline:
                      e.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-800 bg-[#0b1016] px-4 py-3 text-sm text-white outline-none focus:border-[#27d59b]"
              />
            </Field>

            <div className="rounded-2xl border border-gray-800 bg-[#0b1016] p-4">

              <p className="text-sm text-gray-500">
                Este objetivo comenzará en:
              </p>

              <p className="mt-1 text-xl font-black">
                {getInitialPreview()}
              </p>

            </div>

            <ModalActions
              cancel={
                closeAllModals
              }
              confirm={
                createGoal
              }
              confirmText={
                saving
                  ? "Creando..."
                  : "Crear objetivo"
              }
              disabled={
                saving
              }
            />

          </div>
        </Modal>
      )}

      {showAddMoneyModal &&
        selectedGoal && (
          <Modal
            title="Agregar dinero"
            onClose={
              closeAllModals
            }
          >
            <div className="space-y-5">

              <div>
                <p className="text-sm text-gray-500">
                  Objetivo
                </p>

                <p className="mt-1 text-lg font-bold">
                  {
                    selectedGoal.name
                  }
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Moneda del objetivo:{" "}
                  {
                    selectedGoal.currency
                  }
                </p>
              </div>

              {selectedGoal.currency ===
                "USD" && (
                <Field label="Quiero agregar en">
                  <div className="grid grid-cols-2 gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        setAddMoneyMode(
                          "ARS"
                        )
                      }
                      className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                        addMoneyMode ===
                        "ARS"
                          ? "border-[#27d59b] bg-[#27d59b]/10 text-[#27d59b]"
                          : "border-gray-800 bg-[#0b1016] text-gray-400 hover:bg-white/5"
                      }`}
                    >
                      $ ARS
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setAddMoneyMode(
                          "USD"
                        )
                      }
                      className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                        addMoneyMode ===
                        "USD"
                          ? "border-[#27d59b] bg-[#27d59b]/10 text-[#27d59b]"
                          : "border-gray-800 bg-[#0b1016] text-gray-400 hover:bg-white/5"
                      }`}
                    >
                      US$ USD
                    </button>

                  </div>
                </Field>
              )}

              <Field label="Monto a agregar">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    amountToAdd
                  }
                  onChange={(e) =>
                    setAmountToAdd(
                      e.target.value
                    )
                  }
                  placeholder={
                    selectedGoal.currency ===
                      "USD" &&
                    addMoneyMode ===
                      "USD"
                      ? "500"
                      : "200000"
                  }
                  className="w-full rounded-xl border border-gray-800 bg-[#0b1016] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#27d59b]"
                />
              </Field>

              {selectedGoal.currency ===
                "USD" &&
                exchangeRate && (
                <div className="rounded-2xl border border-gray-800 bg-[#0b1016] p-4">

                  <p className="text-sm text-gray-500">
                    Conversión del aporte
                  </p>

                  <p className="mt-1 text-xl font-black">
                    {getAddMoneyPreview()}
                  </p>

                  <p className="mt-2 text-xs text-gray-600">
                    Dólar venta:{" "}
                    {formatARS(
                      exchangeRate.rate
                    )}{" "}
                    por USD
                  </p>

                </div>
              )}

              <div className="rounded-2xl border border-gray-800 bg-[#0b1016] p-4">

                <p className="text-sm text-gray-500">
                  Ahorro acumulado actual
                </p>

                {selectedGoal.currency ===
                  "USD" &&
                exchangeRate ? (
                  <>
                    <p className="mt-1 text-xl font-black">
                      {formatUSD(
                        getCurrentUSD(
                          selectedGoal
                        ) ?? 0
                      )}
                    </p>

                    <p className="mt-1 text-xs text-gray-600">
                      Ahorro real:{" "}
                      {formatARS(
                        getCurrentARS(
                          selectedGoal
                        )
                      )}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-xl font-black">
                    {formatARS(
                      getCurrentARS(
                        selectedGoal
                      )
                    )}
                  </p>
                )}

              </div>

              <ModalActions
                cancel={
                  closeAllModals
                }
                confirm={
                  addMoney
                }
                confirmText={
                  saving
                    ? "Agregando..."
                    : "Agregar dinero"
                }
                disabled={
                  saving ||
                  (
                    selectedGoal.currency ===
                    "USD" &&
                    !exchangeRate
                  )
                }
              />

            </div>
          </Modal>
        )}

      {showEditModal &&
        selectedGoal && (
          <Modal
            title="Editar objetivo"
            onClose={
              closeAllModals
            }
          >
            <div className="space-y-5">

              <Field label="Nombre del objetivo">
                <input
                  value={
                    form.name
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-800 bg-[#0b1016] px-4 py-3 text-sm text-white outline-none focus:border-[#27d59b]"
                />
              </Field>

              <Field label="Moneda del objetivo">
                <div className="grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        currency:
                          "ARS",
                      })
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                      form.currency ===
                      "ARS"
                        ? "border-[#27d59b] bg-[#27d59b]/10 text-[#27d59b]"
                        : "border-gray-800 bg-[#0b1016] text-gray-400 hover:bg-white/5"
                    }`}
                  >
                    $ ARS
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        plan !==
                        "pro"
                      ) {
                        setShowUpgradeModal(
                          true
                        );
                        return;
                      }

                      setForm({
                        ...form,
                        currency:
                          "USD",
                      });
                    }}
                    className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                      form.currency ===
                        "USD" &&
                      plan ===
                        "pro"
                        ? "border-[#27d59b] bg-[#27d59b]/10 text-[#27d59b]"
                        : "border-gray-800 bg-[#0b1016] text-gray-400 hover:bg-white/5"
                    }`}
                  >
                    US$ USD

                    {plan !==
                      "pro" && (
                      <span className="ml-2 text-[10px] text-[#27d59b]">
                        PRO
                      </span>
                    )}
                  </button>

                </div>
              </Field>

              <Field label="Monto objetivo">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={
                    form.target_amount
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      target_amount:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-800 bg-[#0b1016] px-4 py-3 text-sm text-white outline-none focus:border-[#27d59b]"
                />
              </Field>

              <Field label="Ahorro acumulado">
                {form.currency ===
                  "USD" && (
                  <div className="mb-3 grid grid-cols-2 gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        setEditSavingsMode(
                          "ARS"
                        )
                      }
                      className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                        editSavingsMode ===
                        "ARS"
                          ? "border-[#27d59b] bg-[#27d59b]/10 text-[#27d59b]"
                          : "border-gray-800 bg-[#0b1016] text-gray-400 hover:bg-white/5"
                      }`}
                    >
                      $ ARS
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEditSavingsMode(
                          "USD"
                        )
                      }
                      className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                        editSavingsMode ===
                        "USD"
                          ? "border-[#27d59b] bg-[#27d59b]/10 text-[#27d59b]"
                          : "border-gray-800 bg-[#0b1016] text-gray-400 hover:bg-white/5"
                      }`}
                    >
                      US$ USD
                    </button>

                  </div>
                )}

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    editSavingsAmount
                  }
                  onChange={(e) =>
                    setEditSavingsAmount(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-800 bg-[#0b1016] px-4 py-3 text-sm text-white outline-none focus:border-[#27d59b]"
                />

                {form.currency ===
                  "USD" &&
                  exchangeRate && (
                  <div className="mt-3 rounded-xl border border-gray-800 bg-[#0b1016] p-3">

                    <p className="text-xs text-gray-500">
                      Valor equivalente
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-300">
                      {getEditSavingsPreview()}
                    </p>

                    <p className="mt-2 text-xs text-gray-600">
                      Dólar venta:{" "}
                      {formatARS(
                        exchangeRate.rate
                      )}{" "}
                      por USD
                    </p>

                  </div>
                )}
              </Field>

              <Field label="Fecha límite (opcional)">
                <input
                  type="date"
                  value={
                    form.deadline
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      deadline:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-800 bg-[#0b1016] px-4 py-3 text-sm text-white outline-none focus:border-[#27d59b]"
                />
              </Field>

              <ModalActions
                cancel={
                  closeAllModals
                }
                confirm={
                  editGoal
                }
                confirmText={
                  saving
                    ? "Guardando..."
                    : "Guardar cambios"
                }
                disabled={
                  saving
                }
              />

            </div>
          </Modal>
        )}

      {showDeleteModal &&
        selectedGoal && (
          <Modal
            title="Eliminar objetivo"
            onClose={
              closeAllModals
            }
          >
            <p className="text-sm leading-6 text-gray-400">
              ¿Seguro que querés eliminar{" "}
              <span className="font-semibold text-white">
                {
                  selectedGoal.name
                }
              </span>
              ? Esta acción no se puede deshacer.
            </p>

            <div className="mt-6 flex gap-3">

              <button
                onClick={
                  closeAllModals
                }
                disabled={
                  saving
                }
                className="flex-1 rounded-xl border border-gray-800 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/5"
              >
                Cancelar
              </button>

              <button
                onClick={
                  deleteGoal
                }
                disabled={
                  saving
                }
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-400 disabled:opacity-50"
              >
                {saving
                  ? "Eliminando..."
                  : "Eliminar"}
              </button>

            </div>
          </Modal>
        )}

      {showUpgradeModal && (
        <Modal
          title="HormiGUITA Pro"
          onClose={() =>
            setShowUpgradeModal(
              false
            )
          }
        >
          <div className="space-y-5">

            <div>
              <h3 className="text-2xl font-black">
                Desbloqueá más objetivos
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Con HormiGUITA Pro podés tener hasta 5 objetivos y crear metas en dólares.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-gray-800 bg-[#0b1016] p-5">

              <Feature text="Hasta 5 objetivos" />

              <Feature text="Objetivos en ARS y USD" />

              <Feature text="Conversión automática al dólar venta" />

              <Feature text="Seguimiento avanzado de tus metas" />

            </div>

            <div className="flex gap-3">

              <button
                onClick={() =>
                  setShowUpgradeModal(
                    false
                  )
                }
                className="flex-1 rounded-xl border border-gray-800 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/5"
              >
                Ahora no
              </button>

              <button
                onClick={() => {
                  window.location.href =
                    "/#pro";
                }}
                className="flex-1 rounded-xl bg-[#27d59b] px-4 py-3 text-sm font-bold text-[#07110d] transition hover:brightness-110"
              >
                Ver Pro
              </button>

            </div>

          </div>
        </Modal>
      )}
    </main>
  );
}

function Feature({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#27d59b]/10 text-[#27d59b]">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <span className="text-sm text-gray-300">
        {text}
      </span>

    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-300">
        {label}
      </label>

      {children}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

      <div className="w-full max-w-lg rounded-3xl border border-gray-800 bg-[#111720] p-6 shadow-2xl">

        <div className="mb-6 flex items-center justify-between gap-4">

          <h2 className="text-xl font-black">
            {title}
          </h2>

          <button
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-800 text-gray-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Cerrar"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line
                x1="18"
                y1="6"
                x2="6"
                y2="18"
              />

              <line
                x1="6"
                y1="6"
                x2="18"
                y2="18"
              />
            </svg>
          </button>

        </div>

        {children}

      </div>
    </div>
  );
}

function ModalActions({
  cancel,
  confirm,
  confirmText,
  disabled,
}: {
  cancel: () => void;
  confirm: () => void;
  confirmText: string;
  disabled: boolean;
}) {
  return (
    <div className="flex gap-3">

      <button
        onClick={
          cancel
        }
        disabled={
          disabled
        }
        className="flex-1 rounded-xl border border-gray-800 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/5 disabled:opacity-50"
      >
        Cancelar
      </button>

      <button
        onClick={
          confirm
        }
        disabled={
          disabled
        }
        className="flex-1 rounded-xl bg-[#27d59b] px-4 py-3 text-sm font-bold text-[#07110d] transition hover:brightness-110 disabled:opacity-50"
      >
        {confirmText}
      </button>

    </div>
  );
}