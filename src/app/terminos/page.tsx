import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Términos y Condiciones | HormiGUITA",
  description:
    "Términos y Condiciones de uso de HormiGUITA, servicio de gestión de finanzas personales.",
};

export default function TerminosPage() {
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
            Términos y Condiciones
          </h1>
          <p className="mt-4 text-gray-400">
            Última actualización: 10 de septiembre de 2026
          </p>
        </div>

        <div className="space-y-8 text-[15px] leading-7 text-gray-300">
          <section className="rounded-2xl border border-gray-800 bg-[#111720] p-6 sm:p-8">
            <p>
              Estos Términos y Condiciones regulan el acceso y uso de HormiGUITA,
              incluyendo su aplicación web y las funciones que permiten registrar
              ingresos, egresos, ahorros, objetivos y movimientos mediante WhatsApp.
              Al utilizar el servicio, aceptás estos términos.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              1. Sobre HormiGUITA
            </h2>
            <p>
              HormiGUITA es una herramienta de organización y gestión de finanzas
              personales. Su objetivo es ayudar a registrar y visualizar la
              información financiera que proporcionás.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              2. Uso de la cuenta
            </h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Debés proporcionar información que sea razonablemente correcta y
                mantener actualizados tus datos de acceso cuando corresponda.
              </li>
              <li>
                Sos responsable de mantener la confidencialidad de tu contraseña y
                de las actividades realizadas desde tu cuenta.
              </li>
              <li>
                No debés utilizar HormiGUITA para actividades ilegales, abusivas o
                que puedan afectar el funcionamiento o la seguridad del servicio.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              3. Información financiera
            </h2>
            <p>
              La información financiera que cargás en HormiGUITA es proporcionada
              voluntariamente por vos. Debés revisar los datos registrados y
              verificar que los montos, fechas, categorías y objetivos sean
              correctos antes de utilizarlos para tomar decisiones.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              4. La información no constituye asesoramiento financiero
            </h2>
            <p>
              HormiGUITA es una herramienta tecnológica de organización personal y
              no constituye asesoramiento financiero, contable, impositivo, legal
              ni de inversión. Las decisiones que tomes a partir de la información
              mostrada por el servicio son responsabilidad tuya.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              5. WhatsApp y funciones automáticas
            </h2>
            <p>
              Cuando utilices la integración con WhatsApp, HormiGUITA podrá
              interpretar mensajes de texto y, cuando la función esté disponible,
              audios para identificar instrucciones relacionadas con tus finanzas.
              Las interpretaciones automáticas pueden contener errores, por lo que
              deberás revisar la información registrada cuando corresponda.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              6. Disponibilidad del servicio
            </h2>
            <p>
              Procuramos mantener HormiGUITA disponible y funcionando de forma
              estable, pero el servicio puede presentar interrupciones por tareas
              de mantenimiento, fallas técnicas, problemas de proveedores o
              situaciones fuera de nuestro control.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              7. Servicios de terceros
            </h2>
            <p>
              HormiGUITA depende de proveedores tecnológicos externos para algunas
              funciones, entre ellos Supabase, Vercel, Meta/WhatsApp y OpenAI.
              El uso de determinados servicios puede quedar sujeto además a las
              condiciones y políticas de esos proveedores.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              8. Propiedad y uso del servicio
            </h2>
            <p>
              El nombre HormiGUITA, su identidad visual, software, contenidos y
              componentes propios del servicio no pueden ser copiados, modificados,
              revendidos o utilizados de una forma que infrinja derechos aplicables
              sin autorización.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              9. Suspensión o cierre de cuentas
            </h2>
            <p>
              Podemos suspender o limitar el acceso cuando sea necesario para
              proteger el servicio, investigar abusos, cumplir obligaciones legales
              o prevenir usos que puedan perjudicar a HormiGUITA o a otras personas.
              También podés solicitar el cierre de tu cuenta siguiendo el mecanismo
              de eliminación de datos indicado en el servicio.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              10. Cambios en estos términos
            </h2>
            <p>
              Podemos actualizar estos Términos y Condiciones cuando cambien las
              funcionalidades del servicio o las obligaciones aplicables. La
              versión vigente estará publicada en esta página con su fecha de
              actualización.
            </p>
          </section>

          <section className="rounded-2xl border border-[#27d59b]/20 bg-[#27d59b]/5 p-6">
            <h2 className="text-xl font-black text-white">Contacto</h2>
            <p className="mt-2">
              Para consultas sobre estos términos:
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
