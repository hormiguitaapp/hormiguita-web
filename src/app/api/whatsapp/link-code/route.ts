import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function generateCode() {
  const number = Math.floor(100000 + Math.random() * 900000);
  return `HORMI-${number}`;
}

export async function POST() {
  try {
    const supabase = await createClient();

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

    // Una cuenta que ya está vinculada no necesita generar otro código.
    const { data: connection, error: connectionError } = await supabase
      .from("whatsapp_connections")
      .select("phone_number")
      .eq("user_id", user.id)
      .maybeSingle();

    if (connectionError) {
      console.error("Error comprobando conexión de WhatsApp:", connectionError);

      return NextResponse.json(
        { error: "No se pudo comprobar el estado de WhatsApp." },
        { status: 500 }
      );
    }

    if (connection?.phone_number) {
      return NextResponse.json(
        { error: "Esta cuenta ya tiene un WhatsApp vinculado." },
        { status: 409 }
      );
    }

    // Eliminamos códigos anteriores para que solo exista un código activo.
    const { error: deleteError } = await supabase
      .from("whatsapp_link_codes")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error eliminando códigos anteriores:", deleteError);

      return NextResponse.json(
        { error: "No se pudo preparar un nuevo código de vinculación." },
        { status: 500 }
      );
    }

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    ).toISOString();

    let code = "";
    let created = false;

    for (let attempt = 0; attempt < 5; attempt++) {
      code = generateCode();

      const { error } = await supabase
        .from("whatsapp_link_codes")
        .insert({
          user_id: user.id,
          code,
          expires_at: expiresAt,
        });

      if (!error) {
        created = true;
        break;
      }

      if (error.code !== "23505") {
        console.error("Error creando código:", error);

        return NextResponse.json(
          { error: "No se pudo generar el código." },
          { status: 500 }
        );
      }
    }

    if (!created) {
      return NextResponse.json(
        { error: "No se pudo generar un código único." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      code,
      expiresAt,
      expiresInMinutes: 10,
    });
  } catch (error) {
    console.error("Error en link-code:", error);

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
