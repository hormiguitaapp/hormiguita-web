import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Eliminación de datos | HormiGUITA",
  description:
    "Instrucciones para solicitar la eliminación de tu cuenta y datos de HormiGUITA.",
};

export default function EliminacionDatosPage() {
  return (
    <main className="min-h-screen bg-[#080a0d] text-white">
      <header className="border-b border-white/10 bg-[#080a0d]/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo-HormiGUITA.png"
              alt="Logo HormiGUITA"
              width={44}
              height={44}
              className="object-contain"
              priority
            />
            <span className="text-xl font-black tracking-tight">
              Hormi<span className="text-[#27d59b]">GUITA</span>
            </span>
          </Link>

          <Link
            href="/"
            className="text-sm font-semibold text-gray-400 transition hover:text-white"
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[2px] text-[#27d59b]">
            HormiGUITA
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Eliminación de datos
          </h1>
          <p className="mt-4 text-gray-400">
            Última actualización: 10 de septiembre de 2026
          </p>
        </div>

        <div className="space-y-8 text-[15px] leading-7 text-gray-300">
          <section className="rounded-2xl border border-gray-800 bg-[#111720] p-6 sm:p-8">
            <p>
              Podés solicitar la eliminación de tu cuenta y de los datos
              asociados a HormiGUITA en cualquier momento. Esta página explica
              el procedimiento y qué información necesitamos para identificar
              correctamente la solicitud.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              Cómo solicitar la eliminación
            </h2>
            <p>
              Enviá un correo a:
            </p>
            <p className="mt-3 font-semibold text-[#27d59b]">
              hormiguita.app@gmail.com
            </p>
            <p className="mt-3">
              Usá como asunto <strong className="text-white">“Eliminar mi cuenta de HormiGUITA”</strong>
              y, desde el mismo correo asociado a tu cuenta, indicá que querés
              eliminar tu cuenta y los datos vinculados a ella.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              Qué podemos eliminar
            </h2>
            <p>
              Según la solicitud y la información disponible, podremos eliminar
              o desvincular los datos asociados a tu cuenta, incluyendo datos de
              perfil, movimientos financieros, objetivos y la información
              relacionada con tu conexión a WhatsApp, en la medida permitida por
              las obligaciones legales y técnicas aplicables.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              Qué puede conservarse temporalmente
            </h2>
            <p>
              Determinados registros técnicos, respaldos o información que debamos
              conservar por obligaciones legales, prevención de fraude, seguridad
              o resolución de reclamos pueden permanecer durante el período que
              resulte necesario antes de su eliminación o anonimización.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              Eliminación de datos vinculados con WhatsApp
            </h2>
            <p>
              Si utilizaste el número de WhatsApp de HormiGUITA para registrar
              movimientos, la solicitud puede incluir la eliminación o
              desvinculación de la información asociada a esa integración.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              Después de solicitarla
            </h2>
            <p>
              Podemos pedir datos adicionales para comprobar que la solicitud
              proviene de la persona titular de la cuenta. Una vez validada,
              procesaremos la eliminación conforme a nuestras políticas y a las
              obligaciones aplicables.
            </p>
          </section>

          <section className="rounded-2xl border border-[#27d59b]/20 bg-[#27d59b]/5 p-6">
            <h2 className="text-xl font-black text-white">Contacto</h2>
            <p className="mt-2">
              Solicitudes de eliminación de datos:
              <span className="font-semibold text-[#27d59b]">
                {" "}hormiguita.app@gmail.com
              </span>
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
