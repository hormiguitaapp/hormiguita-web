"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // 2FA
  // =========================

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  const [twoFactorFactorId, setTwoFactorFactorId] =
    useState<string | null>(null);

  const [twoFactorChallengeId, setTwoFactorChallengeId] =
    useState<string | null>(null);

  // =========================
  // DISPOSITIVO CONFIABLE
  // =========================

  const [trustDevice, setTrustDevice] = useState(false);

  async function iniciarSesion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Completá tu correo y contraseña.");
      return;
    }

    setLoading(true);

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      console.error("LOGIN ERROR:", loginError);

      setError(
        "No pudimos iniciar sesión. Revisá tu correo y contraseña."
      );

      setLoading(false);
      return;
    }

    /*
     * Primero comprobamos si este navegador
     * ya está marcado como dispositivo confiable.
     *
     * Si lo está, después del login no necesitamos
     * volver a pedir el código 2FA.
     */

    try {
      const trustedResponse = await fetch(
        "/api/security/trusted-device",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (trustedResponse.ok) {
        const trustedData = await trustedResponse.json();

        if (trustedData.trusted === true) {
          window.location.href = "/dashboard";
          return;
        }
      }
    } catch (error) {
      /*
       * Si falla la comprobación del dispositivo,
       * NO saltamos el 2FA.
       *
       * Continuamos normalmente con la verificación.
       */
      console.error(
        "TRUSTED DEVICE CHECK ERROR:",
        error
      );
    }

    /*
     * Verificamos el nivel actual de autenticación.
     *
     * aal1 = contraseña
     * aal2 = contraseña + 2FA
     */

    const {
      data: assuranceData,
      error: assuranceError,
    } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (assuranceError) {
      console.error(
        "ASSURANCE ERROR:",
        assuranceError
      );

      await supabase.auth.signOut();

      setError(
        "No pudimos verificar el estado de seguridad de tu cuenta."
      );

      setLoading(false);
      return;
    }

    /*
     * Buscamos los factores MFA configurados.
     */

    const {
      data: factorsData,
      error: factorsError,
    } = await supabase.auth.mfa.listFactors();

    if (factorsError) {
      console.error(
        "FACTORS ERROR:",
        factorsError
      );

      await supabase.auth.signOut();

      setError(
        "No pudimos comprobar la configuración de seguridad."
      );

      setLoading(false);
      return;
    }

    const verifiedFactor =
      factorsData?.totp?.find(
        (factor) => factor.status === "verified"
      );

    /*
     * Si existe un factor TOTP verificado
     * y todavía estamos en aal1,
     * necesitamos el código 2FA.
     */

    if (
      verifiedFactor &&
      assuranceData.currentLevel === "aal1"
    ) {
      const {
        data: challengeData,
        error: challengeError,
      } = await supabase.auth.mfa.challenge({
        factorId: verifiedFactor.id,
      });

      if (challengeError) {
        console.error(
          "CHALLENGE ERROR:",
          challengeError
        );

        await supabase.auth.signOut();

        setError(
          "No pudimos iniciar la verificación en dos pasos."
        );

        setLoading(false);
        return;
      }

      if (!challengeData?.id) {
        console.error(
          "CHALLENGE ERROR: No se recibió challengeId"
        );

        await supabase.auth.signOut();

        setError(
          "No pudimos preparar la verificación en dos pasos."
        );

        setLoading(false);
        return;
      }

      setTwoFactorFactorId(
        verifiedFactor.id
      );

      setTwoFactorChallengeId(
        challengeData.id
      );

      setTwoFactorCode("");

      setShowTwoFactor(true);

      setLoading(false);

      return;
    }

    /*
     * Si no tiene 2FA, entra directamente.
     */

    window.location.href = "/dashboard";
  }

  async function verificarTwoFactor() {
    setError("");

    const code =
      twoFactorCode.replace(/\D/g, "");

    if (code.length !== 6) {
      setError(
        "Ingresá el código de 6 dígitos de tu aplicación autenticadora."
      );

      return;
    }

    if (
      !twoFactorFactorId ||
      !twoFactorChallengeId
    ) {
      setError(
        "No hay una verificación 2FA activa."
      );

      return;
    }

    setTwoFactorLoading(true);

    const {
      error: verifyError,
    } = await supabase.auth.mfa.verify({
      factorId: twoFactorFactorId,
      challengeId: twoFactorChallengeId,
      code,
    });

    if (verifyError) {
      console.error(
        "2FA VERIFY ERROR:",
        verifyError
      );

      setError(
        "El código de verificación no es correcto."
      );

      setTwoFactorLoading(false);
      return;
    }

    /*
     * Verificación correcta.
     *
     * Ahora la sesión debería estar en aal2.
     */

    const {
      data: finalAssurance,
      error: finalAssuranceError,
    } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (finalAssuranceError) {
      console.error(
        "FINAL ASSURANCE ERROR:",
        finalAssuranceError
      );

      setError(
        "No pudimos confirmar la autenticación de dos pasos."
      );

      setTwoFactorLoading(false);
      return;
    }

    if (
      finalAssurance.currentLevel !== "aal2"
    ) {
      setError(
        "La verificación 2FA no pudo completarse."
      );

      setTwoFactorLoading(false);
      return;
    }

    /*
     * Si el usuario eligió confiar en este dispositivo,
     * creamos el registro seguro de 30 días.
     */

    if (trustDevice) {
      try {
        const trustedResponse =
          await fetch(
            "/api/security/trusted-device",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                deviceName:
                  navigator.userAgent.includes(
                    "Windows"
                  )
                    ? "PC Windows"
                    : "Dispositivo",
              }),
            }
          );

        if (!trustedResponse.ok) {
          console.error(
            "No se pudo guardar el dispositivo confiable."
          );
        }
      } catch (error) {
        /*
         * Si falla el guardado del dispositivo,
         * no bloqueamos el login porque el 2FA
         * ya fue verificado correctamente.
         */
        console.error(
          "TRUST DEVICE ERROR:",
          error
        );
      }
    }

    window.location.href = "/dashboard";
  }

  async function cancelarTwoFactor() {
    await supabase.auth.signOut();

    setShowTwoFactor(false);
    setTwoFactorCode("");
    setTwoFactorFactorId(null);
    setTwoFactorChallengeId(null);
    setTrustDevice(false);
    setError("");
    setLoading(false);
  }

  // =========================
  // PANTALLA 2FA
  // =========================

  if (showTwoFactor) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080a0d] px-6 py-10 text-white">
        <div className="w-full max-w-md">

          {/* LOGO */}

          <div className="mb-8 flex justify-center">
            <Link href="/">
              <Image
                src="/logo-HormiGUITA.png"
                alt="HormiGUITA"
                width={90}
                height={90}
                priority
                className="object-contain"
              />
            </Link>
          </div>

          {/* CARD */}

          <div className="rounded-3xl border border-gray-800 bg-[#111720] p-8 shadow-2xl">

            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#27d59b]/10 text-3xl">
                🔐
              </div>

              <h1 className="text-3xl font-black">
                Verificación en dos pasos
              </h1>

              <p className="mt-3 text-gray-400">
                Abrí tu aplicación autenticadora e
                ingresá el código de 6 dígitos.
              </p>
            </div>

            <div className="space-y-5">

              {/* CÓDIGO */}

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Código de autenticación
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) =>
                    setTwoFactorCode(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  placeholder="123456"
                  className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-white outline-none transition focus:border-[#27d59b]"
                />
              </div>

              {/* ERROR */}

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* DISPOSITIVO CONFIABLE */}

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-800 bg-[#0b1016] p-4">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) =>
                    setTrustDevice(
                      e.target.checked
                    )
                  }
                  disabled={twoFactorLoading}
                  className="mt-1 h-4 w-4 accent-[#27d59b]"
                />

                <span>
                  <span className="block text-sm font-semibold text-gray-200">
                    Confiar en este dispositivo durante 30 días
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-gray-500">
                    No te pediremos el código 2FA
                    nuevamente desde este navegador
                    durante 30 días.
                  </span>
                </span>
              </label>

              {/* VERIFICAR */}

              <button
                type="button"
                onClick={verificarTwoFactor}
                disabled={
                  twoFactorLoading ||
                  twoFactorCode.length !== 6
                }
                className="w-full rounded-xl bg-gradient-to-r from-[#27d59b] to-[#16b78a] px-5 py-4 font-extrabold text-[#032119] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {twoFactorLoading
                  ? "Verificando..."
                  : "Verificar y continuar"}
              </button>

              {/* CANCELAR */}

              <button
                type="button"
                onClick={cancelarTwoFactor}
                disabled={twoFactorLoading}
                className="w-full rounded-xl border border-gray-700 px-5 py-3 font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                Volver al inicio de sesión
              </button>

            </div>

            <div className="mt-7 text-center text-xs text-gray-600">
              Tu código cambia cada pocos segundos.
            </div>

          </div>
        </div>
      </main>
    );
  }

  // =========================
  // LOGIN NORMAL
  // =========================

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080a0d] px-6 py-10 text-white">

      <div className="w-full max-w-md">

        {/* LOGO */}

        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Image
              src="/logo-HormiGUITA.png"
              alt="HormiGUITA"
              width={90}
              height={90}
              priority
              className="object-contain"
            />
          </Link>
        </div>

        {/* CARD */}

        <div className="rounded-3xl border border-gray-800 bg-[#111720] p-8 shadow-2xl">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black">
              Bienvenido 🐜
            </h1>

            <p className="mt-2 text-gray-400">
              Ingresá a tu cuenta de HormiGUITA
            </p>
          </div>

          <form
            onSubmit={iniciarSesion}
            className="space-y-5"
          >

            {/* EMAIL */}

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Correo electrónico
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="tu@email.com"
                autoComplete="email"
                required
                disabled={loading}
                className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none transition focus:border-[#27d59b] disabled:opacity-50"
              />
            </div>

            {/* PASSWORD */}

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-sm text-gray-300">
                  Contraseña
                </label>

                <button
                  type="button"
                  className="text-xs text-[#27d59b] hover:underline"
                  onClick={() =>
                    setError(
                      "La recuperación de contraseña la vamos a agregar en el siguiente paso."
                    )
                  }
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Tu contraseña"
                autoComplete="current-password"
                required
                disabled={loading}
                className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 text-white outline-none transition focus:border-[#27d59b] disabled:opacity-50"
              />
            </div>

            {/* ERROR */}

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* LOGIN */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#27d59b] to-[#16b78a] px-5 py-4 font-extrabold text-[#032119] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Iniciando sesión..."
                : "Iniciar sesión"}
            </button>

          </form>

          {/* REGISTRO */}

          <div className="mt-7 text-center text-sm text-gray-500">
            ¿Todavía no tenés una cuenta?

            <Link
              href="/registro"
              className="ml-2 font-semibold text-[#27d59b] hover:underline"
            >
              Crear cuenta
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}