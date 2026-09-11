import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const WABA_ID = process.env.WHATSAPP_WABA_ID;

export async function GET(request: NextRequest) {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
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

    const graphVersion =
      process.env.WHATSAPP_GRAPH_API_VERSION || "v26.0";

    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${WABA_ID}/subscribed_apps`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const text = await response.text();

    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      wabaId: WABA_ID,
      response: data,
    });
  } catch (error) {
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