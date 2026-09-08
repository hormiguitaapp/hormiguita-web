"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegistroPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function registrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
        },
        emailRedirectTo: "http://localhost:3000",
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    console.log("Usuario creado:", data);

    setMensaje(
      "Cuenta creada correctamente. Revisá tu correo para confirmar la cuenta."
    );

    setNombre("");
    setEmail("");
    setPassword("");
    setConfirmarPassword("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080a0d] px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-gray-800 bg-[#111720] p-8 shadow-2xl">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black">
            Crear cuenta 🐜
          </h1>

          <p className="mt-2 text-gray-400">
            Empezá a construir tu GUITA.
          </p>
        </div>

        <form onSubmit={registrar} className="space-y-5">

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Nombre
            </label>

            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              required
              className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 outline-none focus:border-[#27d59b]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Correo electrónico
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 outline-none focus:border-[#27d59b]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 outline-none focus:border-[#27d59b]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Repetir contraseña
            </label>

            <input
              type="password"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              placeholder="Repetí tu contraseña"
              required
              className="w-full rounded-xl border border-gray-700 bg-[#0b1016] px-4 py-3 outline-none focus:border-[#27d59b]"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {mensaje && (
            <div className="rounded-xl border border-[#27d59b]/20 bg-[#27d59b]/10 p-3 text-sm text-[#b9f8db]">
              {mensaje}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#27d59b] to-[#16b78a] px-5 py-4 font-extrabold text-[#032119] transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tenés una cuenta?
          <a
            href="/login"
            className="ml-2 text-[#27d59b] hover:underline"
          >
            Iniciar sesión
          </a>
        </div>

      </div>
    </main>
  );
}