import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad | HormiGUITA",
  description:
    "Política de Privacidad de HormiGUITA, tu asistente personal de finanzas.",
};

export default function PrivacidadPage() {
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
            Política de Privacidad
          </h1>
          <p className="mt-4 text-gray-400">
            Última actualización: 10 de septiembre de 2026
          </p>
        </div>

        <div className="space-y-8 text-[15px] leading-7 text-gray-300">
          <section className="rounded-2xl border border-gray-800 bg-[#111720] p-6 sm:p-8">
            <p>
              En HormiGUITA nos importa la privacidad de las personas que usan
              nuestro servicio. Esta Política de Privacidad explica qué datos
              podemos recopilar, para qué los usamos y con qué proveedores
              tecnológicos trabajamos cuando utilizás la aplicación y sus
              funciones relacionadas con WhatsApp.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              1. Responsable y contacto
            </h2>
            <p>
              HormiGUITA es el servicio responsable del tratamiento de los datos
              que se gestionan dentro de la aplicación para prestar sus
              funcionalidades. Para consultas relacionadas con privacidad o
              datos personales podés escribir a:
            </p>
            <p className="mt-3 font-semibold text-[#27d59b]">
              hormiguita.app@gmail.com
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              2. Datos que podemos recopilar
            </h2>
            <p>Según las funciones que utilices, podemos recopilar:</p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                Datos de cuenta, como nombre, correo electrónico y credenciales
                necesarias para acceder al servicio.
              </li>
              <li>
                Información financiera que cargues voluntariamente, como
                ingresos, egresos, ahorros, objetivos, montos, categorías y
                fechas.
              </li>
              <li>
                Información relacionada con el uso de WhatsApp cuando elijas
                utilizar esa integración, como tu número de teléfono,
                identificadores del mensaje y contenido enviado al servicio.
              </li>
              <li>
                Audios que envíes por WhatsApp, cuando esa función esté
                habilitada, para poder convertirlos en texto y procesar la
                instrucción correspondiente.
              </li>
              <li>
                Información técnica necesaria para operar y proteger el
                servicio, como registros de actividad, errores y datos básicos
                de la conexión.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              3. Cómo utilizamos la información
            </h2>
            <p>Utilizamos la información para:</p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Crear y administrar tu cuenta de HormiGUITA.</li>
              <li>
                Registrar y organizar los movimientos y objetivos financieros
                que cargues.
              </li>
              <li>
                Procesar mensajes de WhatsApp y ejecutar las acciones que
                solicites dentro de HormiGUITA.
              </li>
              <li>
                Transcribir y comprender audios cuando utilices la función de
                carga por voz.
              </li>
              <li>
                Mantener, mejorar, proteger y detectar errores del servicio.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              4. Proveedores y servicios de terceros
            </h2>
            <p>
              HormiGUITA utiliza proveedores tecnológicos para poder funcionar.
              Dependiendo de la función utilizada, estos pueden incluir:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong className="text-white">Supabase</strong>, para la
                autenticación, almacenamiento y base de datos de la aplicación.
              </li>
              <li>
                <strong className="text-white">Meta / WhatsApp Business</strong>,
                para la recepción y envío de mensajes mediante la plataforma
                de WhatsApp.
              </li>
              <li>
                <strong className="text-white">OpenAI</strong>, cuando sea
                necesario procesar un audio para obtener una transcripción o
                utilizar funciones de comprensión basadas en IA.
              </li>
              <li>
                <strong className="text-white">Vercel</strong>, para alojar y
                ejecutar la aplicación web y sus servicios de backend.
              </li>
            </ul>
            <p className="mt-4">
              Estos proveedores pueden tratar información en la medida necesaria
              para prestar sus servicios, de acuerdo con sus propias políticas y
              condiciones aplicables.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              5. WhatsApp y mensajes de voz
            </h2>
            <p>
              Cuando escribís al número de WhatsApp de HormiGUITA, los mensajes
              pueden ser recibidos por nuestra integración con la plataforma de
              WhatsApp. Si enviás un audio, el archivo puede ser procesado por un
              proveedor de transcripción para convertirlo en texto y permitir que
              HormiGUITA interprete la acción solicitada.
            </p>
            <p className="mt-4">
              Por ejemplo, un mensaje como “Me separé 200 mil para el auto” puede
              ser utilizado para identificar el monto y relacionarlo con un
              objetivo de ahorro dentro de tu cuenta, siempre de acuerdo con la
              funcionalidad disponible al momento de uso.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              6. Seguridad
            </h2>
            <p>
              Aplicamos medidas técnicas y organizativas razonables para proteger
              la información frente a accesos no autorizados, pérdida,
              alteración o divulgación indebida. Sin embargo, ningún sistema
              conectado a Internet puede garantizar seguridad absoluta.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              7. Conservación de los datos
            </h2>
            <p>
              Conservamos la información mientras sea necesaria para prestar el
              servicio, cumplir obligaciones aplicables, resolver reclamos,
              prevenir abusos y mantener registros técnicos razonables. Cuando ya
              no sea necesaria, podremos eliminarla o anonimizarla conforme a las
              posibilidades técnicas y obligaciones aplicables.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              8. Tus derechos y solicitudes
            </h2>
            <p>
              Podés solicitar información sobre los datos asociados a tu cuenta y,
              cuando corresponda, pedir su actualización, corrección o eliminación.
              También podés comunicarte con nosotros para plantear consultas o
              reclamos relacionados con el tratamiento de tus datos.
            </p>
            <p className="mt-4">
              Para cualquier solicitud de privacidad, escribí a:
            </p>
            <p className="mt-3 font-semibold text-[#27d59b]">
              hormiguita.app@gmail.com
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-black text-white">
              9. Cambios en esta política
            </h2>
            <p>
              Podemos actualizar esta Política de Privacidad cuando cambien las
              funcionalidades del servicio, los proveedores utilizados o las
              obligaciones aplicables. Cuando corresponda, publicaremos la nueva
              versión en esta misma página e indicaremos la fecha de actualización.
            </p>
          </section>

          <section className="rounded-2xl border border-[#27d59b]/20 bg-[#27d59b]/5 p-6">
            <h2 className="text-xl font-black text-white">Contacto</h2>
            <p className="mt-2">
              Para consultas sobre privacidad y datos personales: 
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
