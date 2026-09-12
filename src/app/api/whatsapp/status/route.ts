import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET() {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const admin = getAdminClient();

    const { data, error } = await admin
      .from("whatsapp_connections")
      .select("phone_number")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error consultando conexión de WhatsApp:", error);

      return NextResponse.json(
        { error: "No se pudo consultar el estado de WhatsApp." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      connected: !!data?.phone_number,
      phoneNumber: data?.phone_number ?? null,
    });
  } catch (error) {
    console.error("Error en WhatsApp status:", error);

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
