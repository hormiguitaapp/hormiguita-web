import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "hormiguita_trusted_device";
const TRUST_DURATION_DAYS = 30;

async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set(name, value, options);
              }
            );
          } catch {
            // En algunos contextos Next.js no permite
            // modificar cookies durante la lectura.
          }
        },
      },
    }
  );
}

function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

// ----------------------------------------------------
// GET
// Comprueba si este navegador/dispositivo es confiable.
// ----------------------------------------------------

export async function GET() {
  try {
    const supabase =
      await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { trusted: false },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({
        trusted: false,
      });
    }

    const tokenHash = hashToken(token);

    const {
      data: trustedDevice,
      error,
    } = await supabase
      .from("trusted_devices")
      .select("id, expires_at")
      .eq("user_id", user.id)
      .eq("token_hash", tokenHash)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error(
        "TRUSTED DEVICE CHECK ERROR:",
        error
      );

      return NextResponse.json({
        trusted: false,
      });
    }

    if (!trustedDevice) {
      const response = NextResponse.json({
        trusted: false,
      });

      response.cookies.delete(COOKIE_NAME);

      return response;
    }

    return NextResponse.json({
      trusted: true,
      expiresAt: trustedDevice.expires_at,
    });
  } catch (error) {
    console.error(
      "TRUSTED DEVICE GET ERROR:",
      error
    );

    return NextResponse.json({
      trusted: false,
    });
  }
}

// ----------------------------------------------------
// POST
// Marca este navegador como dispositivo confiable.
// ----------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const supabase =
      await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Sesión no válida.",
        },
        { status: 401 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);

    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + TRUST_DURATION_DAYS
    );

    let deviceName = "Dispositivo";

    try {
      const body = await request.json();

      if (
        body?.deviceName &&
        typeof body.deviceName === "string"
      ) {
        deviceName =
          body.deviceName.slice(0, 100);
      }
    } catch {
      // Si no viene body, usamos el nombre por defecto.
    }

    const { error: insertError } =
      await supabase
        .from("trusted_devices")
        .insert({
          user_id: user.id,
          token_hash: tokenHash,
          device_name: deviceName,
          expires_at: expiresAt.toISOString(),
        });

    if (insertError) {
      console.error(
        "TRUSTED DEVICE INSERT ERROR:",
        insertError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "No pudimos recordar este dispositivo.",
        },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    console.error(
      "TRUSTED DEVICE POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Ocurrió un error al recordar el dispositivo.",
      },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------
// DELETE
// Revoca el dispositivo actual.
// ----------------------------------------------------

export async function DELETE() {
  try {
    const supabase =
      await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
        },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();

    const token =
      cookieStore.get(COOKIE_NAME)?.value;

    if (token) {
      const tokenHash = hashToken(token);

      await supabase
        .from("trusted_devices")
        .delete()
        .eq("user_id", user.id)
        .eq("token_hash", tokenHash);
    }

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.delete(COOKIE_NAME);

    return response;
  } catch (error) {
    console.error(
      "TRUSTED DEVICE DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
      },
      { status: 500 }
    );
  }
}