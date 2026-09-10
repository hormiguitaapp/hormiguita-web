import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const graphVersion =
      process.env.WHATSAPP_GRAPH_API_VERSION || "v26.0";

    if (!verifyToken || !accessToken || !phoneNumberId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Faltan variables de WhatsApp en el entorno de Vercel.",
        },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));

    if (body.secret !== verifyToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "No autorizado.",
        },
        { status: 401 }
      );
    }

    const to =
      typeof body.to === "string"
        ? body.to.replace(/\D/g, "")
        : "";

    const text =
      typeof body.text === "string" && body.text.trim()
        ? body.text.trim()
        : "Hola, soy HormiGUITA. Prueba de conexión.";

    if (!to) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Falta el número destinatario. Enviá 'to' en formato internacional.",
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: {
            body: text,
          },
        }),
      }
    );

    const responseText = await response.text();

    let data: unknown;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = {
        raw: responseText,
      };
    }

    if (!response.ok) {
      console.error("Error de Meta al enviar WhatsApp:", data);

      return NextResponse.json(
        {
          ok: false,
          metaStatus: response.status,
          metaResponse: data,
        },
        { status: 502 }
      );
    }

    console.log("WhatsApp enviado correctamente:", data);

    return NextResponse.json({
      ok: true,
      metaResponse: data,
    });
  } catch (error) {
    console.error("Error en test-send de WhatsApp:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido.",
      },
      { status: 500 }
    );
  }
}