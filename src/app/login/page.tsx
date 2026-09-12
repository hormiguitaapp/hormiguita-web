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
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07090b] px-5 py-10 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[18%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#27d59b]/[0.045] blur-[110px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.025),transparent_42%)]" />
        </div>
        <div className="relative z-10 w-full max-w-[430px]">

          {/* LOGO */}

          <div className="mb-7 flex justify-center">
            <Link href="/">
              <Image
                src="/logo-HormiGUITA.png"
                alt="HormiGUITA"
                width={72}
                height={72}
                priority
                className="object-contain drop-shadow-[0_0_22px_rgba(39,213,155,0.18)]"
              />
            </Link>
          </div>

          {/* CARD */}

          <div className="rounded-[26px] border border-white/[0.08] bg-[#0d1218]/95 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-8">

            <div className="mb-7 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#27d59b]/15 bg-[#27d59b]/[0.08] text-2xl shadow-[0_10px_35px_rgba(39,213,155,0.08)]">
                🔐
              </div>

              <h1 className="text-[30px] font-black tracking-[-0.035em]">
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
                <label className="mb-2 block text-[13px] font-medium text-[#c6ced7]">
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
                  className="w-full rounded-xl border border-white/[0.09] bg-[#080c10] px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-white outline-none transition focus:border-[#27d59b]/70 focus:ring-4 focus:ring-[#27d59b]/[0.07]"
                />
              </div>

              {/* ERROR */}

              {error && (
                <div className="rounded-xl border border-red-400/15 bg-red-400/[0.07] p-3 text-[13px] leading-5 text-red-300">
                  {error}
                </div>
              )}

              {/* DISPOSITIVO CONFIABLE */}

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-[#080c10] p-4 transition hover:border-white/[0.11]">
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
                  <span className="block text-[13px] font-semibold text-[#d5dbe1]">
                    Confiar en este dispositivo durante 30 días
                  </span>

                  <span className="mt-1 block text-[12px] leading-5 text-[#68737f]">
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
                className="w-full rounded-xl bg-[#27d59b] px-5 py-3.5 text-[14px] font-extrabold text-[#041c15] shadow-[0_10px_30px_rgba(39,213,155,0.14)] transition hover:bg-[#35dca4] hover:shadow-[0_12px_34px_rgba(39,213,155,0.20)] disabled:cursor-not-allowed disabled:opacity-50"
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
                className="w-full rounded-xl border border-white/[0.08] px-5 py-3 text-[13px] font-semibold text-[#8a949f] transition hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
              >
                Volver al inicio de sesión
              </button>

            </div>

            <div className="mt-7 text-center text-[11px] text-[#505b66]">
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07090b] px-5 py-10 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[18%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#27d59b]/[0.045] blur-[110px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.025),transparent_42%)]" />
        </div>

      <div className="relative z-10 w-full max-w-[430px]">

        {/* LOGO */}

        <div className="mb-7 flex justify-center">
          <Link href="/">
            <Image
              src="/logo-HormiGUITA.png"
              alt="HormiGUITA"
              width={90}
              height={90}
              priority
              className="object-contain drop-shadow-[0_0_22px_rgba(39,213,155,0.18)]"
            />
          </Link>
        </div>

        {/* CARD */}

        <div className="rounded-[26px] border border-white/[0.08] bg-[#0d1218]/95 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-8">

          <div className="mb-7 text-center">
            <h1 className="text-[30px] font-black tracking-[-0.035em]">
              Bienvenido 🐜
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#89939f]">
              Ingresá a tu cuenta de HormiGUITA
            </p>
          </div>

          <form
            onSubmit={iniciarSesion}
            className="space-y-5"
          >

            {/* EMAIL */}

            <div>
              <label className="mb-2 block text-[13px] font-medium text-[#c6ced7]">
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
                className="w-full rounded-xl border border-white/[0.09] bg-[#080c10] px-4 py-3.5 text-[15px] text-white outline-none transition placeholder:text-[#56616d] focus:border-[#27d59b]/70 focus:bg-[#0a0f14] focus:ring-4 focus:ring-[#27d59b]/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* PASSWORD */}

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-[13px] font-medium text-[#c6ced7]">
                  Contraseña
                </label>

                <button
                  type="button"
                  className="text-[12px] font-medium text-[#35dca4] transition hover:text-[#70ebc2] hover:underline"
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
                className="w-full rounded-xl border border-white/[0.09] bg-[#080c10] px-4 py-3.5 text-[15px] text-white outline-none transition placeholder:text-[#56616d] focus:border-[#27d59b]/70 focus:bg-[#0a0f14] focus:ring-4 focus:ring-[#27d59b]/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* ERROR */}

            {error && (
              <div className="rounded-xl border border-red-400/15 bg-red-400/[0.07] p-3 text-[13px] leading-5 text-red-300">
                {error}
              </div>
            )}

            {/* LOGIN */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#27d59b] px-5 py-3.5 text-[14px] font-extrabold text-[#041c15] shadow-[0_10px_30px_rgba(39,213,155,0.14)] transition hover:bg-[#35dca4] hover:shadow-[0_12px_34px_rgba(39,213,155,0.20)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Iniciando sesión..."
                : "Iniciar sesión"}
            </button>

          </form>

          {/* REGISTRO */}

          <div className="mt-7 border-t border-white/[0.06] pt-6 text-center text-[13px] text-[#69737e]">
            ¿Todavía no tenés una cuenta?

            <Link
              href="/registro"
              className="ml-1.5 font-semibold text-[#35dca4] transition hover:text-[#70ebc2] hover:underline"
            >
              Crear cuenta
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}