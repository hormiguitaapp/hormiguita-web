"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type MfaFactor = {
  id: string;
  friendly_name?: string | null;
  factor_type?: string;
  status: string;
};

export default function MfaPage() {
  const router = useRouter();

  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");

  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const [error, setError] = useState("");

  const getDestination = () => {
    if (typeof window === "undefined") {
      return "/dashboard";
    }

    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");

    if (next && next.startsWith("/")) {
      return next;
    }

    return "/dashboard";
  };

  const createChallenge = async () => {
    setError("");

    const {
      data: { factors },
      error: factorsError,
    } = await supabase.auth.mfa.listFactors();

    if (factorsError) {
      throw new Error(
        "No pudimos comprobar tu autenticación de dos pasos."
      );
    }

    const verifiedFactor = factors?.totp?.find(
      (factor: MfaFactor) => factor.status === "verified"
    );

    // IMPORTANTE:
    // No redirigimos al login.
    // Mostramos el problema para poder diagnosticarlo.
    if (!verifiedFactor) {
      throw new Error(
        "No encontramos un factor 2FA verificado en la sesión actual."
      );
    }

    setFactorId(verifiedFactor.id);

    const {
      data: challengeData,
      error: challengeError,
    } = await supabase.auth.mfa.challenge({
      factorId: verifiedFactor.id,
    });

    if (challengeError || !challengeData?.id) {
      throw new Error(
        "No pudimos generar el desafío de autenticación."
      );
    }

    setChallengeId(challengeData.id);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await createChallenge();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ocurrió un error con la autenticación."
        );
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleVerify = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (code.length !== 6) {
      setError("Ingresá el código de 6 dígitos.");
      return;
    }

    if (!factorId || !challengeId) {
      setError(
        "No se pudo preparar la verificación."
      );
      return;
    }

    setError("");
    setVerifying(true);

    try {
      const { error: verifyError } =
        await supabase.auth.mfa.verify({
          factorId,
          challengeId,
          code,
        });

      if (verifyError) {
        throw new Error(
          "El código es incorrecto o ya venció."
        );
      }

      const {
        data: aalData,
        error: aalError,
      } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (
        aalError ||
        aalData?.currentLevel !== "aal2"
      ) {
        throw new Error(
          "No se pudo completar la verificación de seguridad."
        );
      }

      router.replace(getDestination());
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo verificar el código."
      );

      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080b10] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-4xl mb-4">
            🐜
          </div>

          <p className="text-gray-300">
            Preparando verificación...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080b10] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-gray-800 bg-[#10151d] p-8 shadow-2xl">

          <div className="text-center mb-8">
            <div className="text-5xl mb-4">
              🔐
            </div>

            <h1 className="text-2xl font-bold text-white">
              Verificación en dos pasos
            </h1>

            <p className="text-gray-400 mt-3">
              Abrí tu aplicación autenticadora e
              ingresá el código de 6 dígitos.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify}>

            <label
              htmlFor="mfa-code"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Código de seguridad
            </label>

            <input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
              placeholder="123456"
              className="w-full rounded-2xl border border-gray-700 bg-[#0b0f15] px-5 py-4 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-emerald-500"
              autoFocus
            />

            <button
              type="submit"
              disabled={
                verifying ||
                code.length !== 6 ||
                !factorId ||
                !challengeId
              }
              className="mt-6 w-full rounded-2xl bg-emerald-500 px-5 py-4 font-bold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifying
                ? "Verificando..."
                : "Verificar código"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-4 w-full rounded-2xl border border-gray-700 px-5 py-3 font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            Volver al inicio de sesión
          </button>

          <p className="text-center text-xs text-gray-500 mt-6">
            Tu código cambia cada pocos segundos.
          </p>

        </div>
      </div>
    </main>
  );
}