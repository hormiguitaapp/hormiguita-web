import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const WABA_ID = process.env.WHATSAPP_WABA_ID;

export async function GET(request: NextRequest) {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    const graphVersion =
      process.env.WHATSAPP_GRAPH_API_VERSION || "v26.0";

    if (!accessToken || !verifyToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "Faltan variables de WhatsApp.",
        },
        { status: 500 }
      );
    }

    const secret =
      request.nextUrl.searchParams.get("secret");

    if (secret !== verifyToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "No autorizado.",
        },
        { status: 401 }
      );
    }

    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${WABA_ID}/subscribed_apps`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const responseText = await response.text();

    let data: unknown;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    console.log("Resultado suscripción WABA:", data);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          response: data,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      status: response.status,
      wabaId: WABA_ID,
      response: data,
    });
  } catch (error) {
    console.error("Error suscribiendo WABA:", error);

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