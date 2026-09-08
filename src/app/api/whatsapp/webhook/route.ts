import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (
    mode === "subscribe" &&
    token === verifyToken &&
    challenge
  ) {
    return new NextResponse(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return NextResponse.json(
    { error: "Token de verificación inválido" },
    { status: 403 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("WhatsApp webhook recibido:", body);

    return NextResponse.json(
      { received: true },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida" },
      { status: 400 }
    );
  }
}