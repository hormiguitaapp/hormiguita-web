import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createClient();

    // Obtener el usuario autenticado
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

    // Eliminar códigos de vinculación pendientes
    const { error: codesError } = await supabase
      .from("whatsapp_link_codes")
      .delete()
      .eq("user_id", user.id);

    if (codesError) {
      console.error(
        "Error eliminando códigos de vinculación:",
        codesError
      );

      return NextResponse.json(
        { error: "No se pudieron eliminar los códigos pendientes." },
        { status: 500 }
      );
    }

    // Eliminar la conexión de WhatsApp
    const { error: connectionError } = await supabase
      .from("whatsapp_connections")
      .delete()
      .eq("user_id", user.id);

    if (connectionError) {
      console.error(
        "Error desvinculando WhatsApp:",
        connectionError
      );

      return NextResponse.json(
        { error: "No se pudo desvincular WhatsApp." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp desvinculado correctamente.",
    });
  } catch (error) {
    console.error("Error en unlink:", error);

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}