import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const graphVersion =
      process.env.WHATSAPP_GRAPH_API_VERSION || "v26.0";
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (!accessToken || !verifyToken) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Faltan WHATSAPP_ACCESS_TOKEN o WHATSAPP_VERIFY_TOKEN.",
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

    const wabaId = "1045873878442549";

    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${wabaId}/subscribed_apps`,
      {
        method: "GET",
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
      data = {
        raw: responseText,
      };
    }

    console.log(
      "Resultado suscripción WABA:",
      data
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          metaStatus: response.status,
          metaResponse: data,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      wabaId,
      metaResponse: data,
    });
  } catch (error) {
    console.error(
      "Error comprobando suscripción WABA:",
      error
    );

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