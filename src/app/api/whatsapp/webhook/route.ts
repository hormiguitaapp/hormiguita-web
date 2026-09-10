import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }

  return value;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAmount(text: string) {
  const normalized = text
    .toLowerCase()
    .replace(/\$/g, "")
    .replace(/\s+/g, " ");

  const match = normalized.match(
    /(?<![a-z0-9])([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]+(?:[.,][0-9]+)?)[\s]*(millon(?:es)?|millones|palos|lucas|k|mil)?(?![a-z0-9])/i
  );

  if (!match) {
    return null;
  }

  let raw = match[1];
  const suffix = (match[2] ?? "").toLowerCase();

  if (raw.includes(".") && raw.includes(",")) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  } else if (
    raw.includes(".") &&
    /\.\d{3}$/.test(raw)
  ) {
    raw = raw.replace(/\./g, "");
  } else if (
    raw.includes(",") &&
    /,\d{3}$/.test(raw)
  ) {
    raw = raw.replace(/,/g, "");
  } else {
    raw = raw.replace(",", ".");
  }

  const base = Number(raw);

  if (!Number.isFinite(base) || base <= 0) {
    return null;
  }

  let multiplier = 1;

  if (suffix === "lucas" || suffix === "k" || suffix === "mil") {
    multiplier = 1000;
  }

  if (
    suffix === "millon" ||
    suffix === "millones" ||
    suffix === "palos"
  ) {
    multiplier = 1_000_000;
  }

  const amount = base * multiplier;

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}

function extractGoalPhrase(text: string) {
  const clean = text
    .replace(/\s+/g, " ")
    .trim();

  const patterns = [
    /\bpara\s+(?:el|la)\s+ahorro\s+(?:del|de la|de el)\s+(.+?)(?:[.!?]|$)/i,
    /\bpara\s+(?:el|la)\s+(?:objetivo|meta)\s+(?:del|de la|de el)?\s*(.+?)(?:[.!?]|$)/i,
    /\b(?:objetivo|meta)\s+(?:del|de la|de el)?\s*(.+?)(?:[.!?]|$)/i,
    /\bpara\s+(?:el|la|un|una)\s+(.+?)(?:[.!?]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = clean.match(pattern);

    if (!match?.[1]) {
      continue;
    }

    let goal = match[1]
      .trim()
      .replace(/^ahorro\s+(?:del|de la|de el)\s+/i, "")
      .replace(/^(?:el|la|un|una)\s+/i, "")
      .trim();

    if (goal.length > 80) {
      goal = goal.slice(0, 80).trim();
    }

    if (goal) {
      return goal;
    }
  }

  return null;
}

function looksLikeGoalSaving(text: string) {
  const normalized = normalizeText(text);

  return (
    /\b(separe|separe|separar|separ[eé]|ahorre|ahorre|ahorrar|ahorr[eé]|guarde|guarde|guardar|guard[eé]|aparte|apartar|apart[eé]|puse|poner|meti|meter|deje|dejar|destine|destinar)\b/.test(
      normalized
    ) &&
    /\b(para|objetivo|meta|ahorro)\b/.test(normalized)
  );
}

function extractWhatsAppMessage(body: any) {
  const message =
    body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!message) {
    return null;
  }

  return {
    id: typeof message.id === "string" ? message.id : "",
    from: typeof message.from === "string" ? message.from : "",
    type: typeof message.type === "string" ? message.type : "",
    text:
      typeof message.text?.body === "string"
        ? message.text.body
        : null,
    audioId:
      typeof message.audio?.id === "string"
        ? message.audio.id
        : null,
  };
}

async function transcribeWhatsAppAudio(audioId: string) {
  const accessToken = getEnv("WHATSAPP_ACCESS_TOKEN");
  const graphVersion = getEnv("WHATSAPP_GRAPH_API_VERSION");
  const openAiApiKey = getEnv("OPENAI_API_KEY");

  const mediaResponse = await fetch(
    `https://graph.facebook.com/${graphVersion}/${audioId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!mediaResponse.ok) {
    const errorText = await mediaResponse.text();
    throw new Error(
      `No se pudo obtener el archivo de audio de WhatsApp: ${errorText}`
    );
  }

  const media = (await mediaResponse.json()) as {
    url?: string;
    mime_type?: string;
  };

  if (!media.url) {
    throw new Error("WhatsApp no devolvió una URL para el audio.");
  }

  const audioResponse = await fetch(media.url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!audioResponse.ok) {
    const errorText = await audioResponse.text();
    throw new Error(
      `No se pudo descargar el audio de WhatsApp: ${errorText}`
    );
  }

  const audioBuffer = await audioResponse.arrayBuffer();
  const mimeType = media.mime_type || "audio/ogg";

  const form = new FormData();
  form.append(
    "file",
    new Blob([audioBuffer], { type: mimeType }),
    "whatsapp-audio.ogg"
  );
  form.append("model", "gpt-4o-mini-transcribe");
  form.append("language", "es");
  form.append(
    "prompt",
    "Audio en español argentino sobre finanzas personales, gastos, ingresos, ahorros y objetivos."
  );

  const transcriptionResponse = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
      },
      body: form,
    }
  );

  if (!transcriptionResponse.ok) {
    const errorText = await transcriptionResponse.text();
    throw new Error(
      `No se pudo transcribir el audio: ${errorText}`
    );
  }

  const transcription = (await transcriptionResponse.json()) as {
    text?: string;
  };

  const text = transcription.text?.trim();

  if (!text) {
    throw new Error("La transcripción llegó vacía.");
  }

  return text;
}

async function findConnectedUserId(phone: string) {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("whatsapp_connections")
    .select("user_id")
    .eq("phone_number", normalizePhone(phone))
    .maybeSingle();

  if (error) {
    throw new Error(
      `Error buscando la conexión de WhatsApp: ${error.message}`
    );
  }

  return data?.user_id ?? null;
}

async function getGoals(userId: string) {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("goals")
    .select("id, name, currency, current_amount_ars, target_amount")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `Error cargando objetivos: ${error.message}`
    );
  }

  return data ?? [];
}

function findGoalByPhrase<T extends { id: string; name: string }>(
  goals: T[],
  phrase: string
) {
  const target = normalizeText(phrase);

  if (!target) {
    return null;
  }

  const exact = goals.find(
    (goal) => normalizeText(goal.name) === target
  );

  if (exact) {
    return exact;
  }

  const contained = goals.find((goal) => {
    const goalName = normalizeText(goal.name);
    return (
      goalName.includes(target) ||
      target.includes(goalName)
    );
  });

  return contained ?? null;
}

async function applyContribution(params: {
  userId: string;
  goalId: string;
  amountARS: number;
  description: string;
  source: "whatsapp_text" | "whatsapp_audio";
  externalMessageId: string;
}) {
  const supabase = getAdminClient();

  const { data, error } = await supabase.rpc(
    "apply_whatsapp_goal_contribution",
    {
      p_user_id: params.userId,
      p_goal_id: params.goalId,
      p_amount_ars: params.amountARS,
      p_description: params.description,
      p_source: params.source,
      p_external_message_id:
        params.externalMessageId || null,
    }
  );

  if (error) {
    throw new Error(
      `No se pudo registrar el aporte: ${error.message}`
    );
  }

  return data;
}

async function sendWhatsAppText(to: string, text: string) {
  const accessToken = getEnv("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = getEnv("WHATSAPP_PHONE_NUMBER_ID");
  const graphVersion = getEnv("WHATSAPP_GRAPH_API_VERSION");

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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `No se pudo responder por WhatsApp: ${errorText}`
    );
  }
}

async function processIncomingMessage(message: ReturnType<typeof extractWhatsAppMessage>) {
  if (!message?.id || !message.from) {
    return;
  }

  const userId = await findConnectedUserId(message.from);

  if (!userId) {
    console.warn(
      "WhatsApp no conectado a ningún usuario:",
      message.from
    );
    return;
  }

  let text: string | null = null;
  let source: "whatsapp_text" | "whatsapp_audio";

  if (message.type === "text" && message.text) {
    text = message.text.trim();
    source = "whatsapp_text";
  } else if (
    message.type === "audio" &&
    message.audioId
  ) {
    text = await transcribeWhatsAppAudio(
      message.audioId
    );
    source = "whatsapp_audio";
  } else {
    await sendWhatsAppText(
      message.from,
      "Por ahora puedo procesar mensajes de texto y audios sobre tus finanzas."
    );
    return;
  }

  console.log(
    "WhatsApp texto interpretado:",
    text
  );

  if (!looksLikeGoalSaving(text)) {
    await sendWhatsAppText(
      message.from,
      "Entendí el mensaje, pero para cargar un ahorro necesito algo como: “Me separé 200 lucas para el auto”."
    );
    return;
  }

  const amount = parseAmount(text);
  const goalPhrase = extractGoalPhrase(text);

  if (!amount || !goalPhrase) {
    await sendWhatsAppText(
      message.from,
      "Me faltó identificar el monto o el objetivo. Probá con: “Me separé 200 lucas para el auto”."
    );
    return;
  }

  const goals = await getGoals(userId);
  const goal = findGoalByPhrase(
    goals,
    goalPhrase
  );

  if (!goal) {
    const availableGoals = goals
      .slice(0, 5)
      .map((item) => `• ${item.name}`)
      .join("\n");

    const suffix = availableGoals
      ? `\n\nTus objetivos actuales:\n${availableGoals}`
      : "\n\nTodavía no tenés objetivos creados.";

    await sendWhatsAppText(
      message.from,
      `No encontré un objetivo llamado “${goalPhrase}”. Decime el nombre exacto del objetivo.${suffix}`
    );
    return;
  }

  const updatedGoal = await applyContribution({
    userId,
    goalId: goal.id,
    amountARS: amount,
    description: `Ahorro para ${goal.name}`,
    source,
    externalMessageId: message.id,
  });

  const updatedAmountARS = Number(
    updatedGoal?.current_amount_ars ??
      Number(goal.current_amount_ars ?? 0) +
        amount
  );

  await sendWhatsAppText(
    message.from,
    `Listo. ⭐ Sumé ${new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount)} a tu objetivo “${goal.name}”.\n\nAhorro acumulado: ${new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(updatedAmountARS)}`
  );
}

export async function GET(request: NextRequest) {
  const searchParams =
    request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (
    mode === "subscribe" &&
    token === verifyToken &&
    challenge
  ) {
    return new NextResponse(
      challenge,
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      }
    );
  }

  return NextResponse.json(
    {
      error: "Token de verificación inválido",
    },
    { status: 403 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(
      "WhatsApp webhook recibido:",
      body
    );

    const message =
      extractWhatsAppMessage(body);

    if (message) {
      await processIncomingMessage(
        message
      );
    }

    return NextResponse.json(
      { received: true },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Error procesando webhook de WhatsApp:",
      error
    );

    return NextResponse.json(
      {
        error: "No se pudo procesar el mensaje.",
      },
      { status: 200 }
    );
  }
}
