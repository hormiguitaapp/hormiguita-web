import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// =====================================================
// SUPABASE
// =====================================================

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

// =====================================================
// UTILIDADES
// =====================================================

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

function formatARS(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

// =====================================================
// DETECTAR MONTOS
// =====================================================

function parseAmount(text: string) {
  const normalized = text
    .toLowerCase()
    .replace(/\$/g, "")
    .replace(/\s+/g, " ");

  const match = normalized.match(
    /(?<![a-z0-9])([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]+(?:[.,][0-9]+)?)[\s]*(millones|millon|palos|palo|lucas|luca|mangos|mango|k|mil)?(?![a-z0-9])/i
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

  if (
    suffix === "luca" ||
    suffix === "lucas" ||
    suffix === "mango" ||
    suffix === "mangos" ||
    suffix === "k" ||
    suffix === "mil"
  ) {
    multiplier = 1000;
  }

  if (
    suffix === "millon" ||
    suffix === "millones" ||
    suffix === "palo" ||
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

// =====================================================
// DETECTAR OBJETIVOS / AHORROS
// =====================================================

function extractGoalPhrase(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();

  const patterns = [
    /\bpara\s+(?:el|la)\s+ahorro\s+(?:del|de la|de el)\s+(.+?)(?:[.!?]|$)/i,

    /\bpara\s+(?:mi|el|la|un|una)?\s*(?:objetivo|meta)\s+(?:del|de la|de el)?\s*(.+?)(?:[.!?]|$)/i,

    /\b(?:objetivo|meta)\s+(?:del|de la|de el)?\s*(.+?)(?:[.!?]|$)/i,

    /\bpara\s+(?:el|la|un|una|mi)\s+(.+?)(?:[.!?]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = clean.match(pattern);

    if (!match?.[1]) {
      continue;
    }

    let goal = match[1]
      .trim()
      .replace(/^ahorro\s+(?:del|de la|de el)\s+/i, "")
      .replace(/^(?:el|la|un|una|mi)\s+/i, "")
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

  const savingAction =
    /\b(separe|separar|separando|ahorre|ahorrar|ahorrando|guarde|guardar|guardando|aparte|apartar|apartando|puse|poner|meti|meter|deje|dejar|destine|destinar)\b/.test(
      normalized
    );

  const hasGoalReference =
    /\b(para|objetivo|meta|ahorro)\b/.test(
      normalized
    );

  return savingAction && hasGoalReference;
}

// =====================================================
// DETECTAR GASTOS
// =====================================================

function looksLikeExpense(text: string) {
  const normalized = normalizeText(text);

  return /\b(gaste|gastar|pague|pagar|compre|comprar|me gaste|me costo|costo|salio|salir|abone|abonar|transferi|transferir|puse plata en|puse guita en|pague por)\b/.test(
    normalized
  );
}

// =====================================================
// DETECTAR INGRESOS
// =====================================================

function looksLikeIncome(text: string) {
  const normalized = normalizeText(text);

  return /\b(cobre|cobrar|me pagaron|me pago|recibi|recibir|me entraron|me entro|gane|ganar|vendi|vender|facture|facturar|ingrese|ingresar|me depositaron|me depositaron plata|me transfirieron|me llego plata)\b/.test(
    normalized
  );
}

// =====================================================
// DETECTAR TIPO DE MOVIMIENTO
// =====================================================

function detectTransactionType(
  text: string
): "income" | "expense" | null {
  const income = looksLikeIncome(text);
  const expense = looksLikeExpense(text);

  if (income && !expense) {
    return "income";
  }

  if (expense && !income) {
    return "expense";
  }

  return null;
}

// =====================================================
// DETECTAR CATEGORÍA AUTOMÁTICAMENTE
// =====================================================

function detectCategoryName(
  text: string,
  type: "income" | "expense"
) {
  const normalized = normalizeText(text);

  if (type === "expense") {
    // ALIMENTACIÓN
    if (
      /\b(comida|comer|pan|pizza|hamburguesa|hamburguesas|asado|super|supermercado|mercado|verduleria|verdura|carne|pollo|almuerzo|cena|desayuno|delivery|rappi|pedido ya|helado|cafe|restaurante|bar)\b/.test(
        normalized
      )
    ) {
      return "Alimentación";
    }

    // TRANSPORTE
    if (
      /\b(nafta|combustible|uber|didi|taxi|colectivo|bondi|sube|transporte|estacionamiento|peaje|auto|moto|garage)\b/.test(
        normalized
      )
    ) {
      return "Transporte";
    }

    // VIVIENDA
    if (
      /\b(alquiler|expensas|casa|departamento|vivienda|hipoteca|inmueble|arreglo de casa)\b/.test(
        normalized
      )
    ) {
      return "Vivienda";
    }

    // SALUD
    if (
      /\b(medico|medica|doctor|doctora|farmacia|medicamento|remedio|salud|dentista|odontologo|hospital|obra social|consulta)\b/.test(
        normalized
      )
    ) {
      return "Salud";
    }

    // SERVICIOS
    if (
      /\b(luz|agua|gas|internet|wifi|telefono|celular|netflix|spotify|disney|amazon prime|suscripcion|servicio|factura)\b/.test(
        normalized
      )
    ) {
      return "Servicios";
    }

    // OCIO
    if (
      /\b(cine|salida|boliche|fiesta|juego|steam|playstation|xbox|ocio|entretenimiento|recital|vacaciones)\b/.test(
        normalized
      )
    ) {
      return "Ocio";
    }

    // COMPRAS
    if (
      /\b(remera|ropa|zapatilla|zapatillas|campera|pantalon|compra|compras|mercado libre|amazon|producto|regalo)\b/.test(
        normalized
      )
    ) {
      return "Compras";
    }

    return "Otros";
  }

  // =====================================================
  // INGRESOS
  // =====================================================

  // SUELDO
  if (
    /\b(sueldo|salario|quincena|quincenal|mensual)\b/.test(
      normalized
    )
  ) {
    return "Sueldo";
  }

  // VENTAS
  if (
    /\b(vendi|venta|vendimos|cliente|clientes|producto vendido)\b/.test(
      normalized
    )
  ) {
    return "Ventas";
  }

  // NEGOCIO
  if (
    /\b(negocio|emprendimiento|tienda|local|empresa|ganancia del negocio)\b/.test(
      normalized
    )
  ) {
    return "Negocio";
  }

  // INVERSIONES
  if (
    /\b(inversion|inversiones|intereses|rendimiento|acciones|crypto|bitcoin|dolar|plazo fijo)\b/.test(
      normalized
    )
  ) {
    return "Inversiones";
  }

  // TRABAJO
  if (
    /\b(trabajo|laburo|freelance|freelancer|proyecto|cliente|honorarios)\b/.test(
      normalized
    )
  ) {
    return "Trabajo";
  }

  return "Otros";
}

// =====================================================
// DESCRIPCIÓN DEL MOVIMIENTO
// =====================================================

function createDescription(
  text: string,
  amount: number
) {
  let description = text.trim();

  // Quitamos el monto para que quede una descripción más limpia
  const formattedAmount = String(amount);

  if (
    description.length > 150
  ) {
    description = description.slice(0, 150).trim();
  }

  return description || `Movimiento de ${formattedAmount}`;
}

// =====================================================
// CÓDIGO DE VINCULACIÓN
// =====================================================

function extractLinkCode(text: string | null) {
  if (!text) return null;

  const clean = text.trim().toUpperCase();

  const match = clean.match(
    /\bHORMI\s*-\s*(\d{6})\b/
  );

  return match ? `HORMI-${match[1]}` : null;
}

// =====================================================
// EXTRAER MENSAJE DE WHATSAPP
// =====================================================

function extractWhatsAppMessage(body: any) {
  const message =
    body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!message) {
    return null;
  }

  return {
    id:
      typeof message.id === "string"
        ? message.id
        : "",

    from:
      typeof message.from === "string"
        ? message.from
        : "",

    type:
      typeof message.type === "string"
        ? message.type
        : "",

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

// =====================================================
// TRANSCRIBIR AUDIO
// =====================================================

async function transcribeWhatsAppAudio(
  audioId: string
) {
  const accessToken = getEnv(
    "WHATSAPP_ACCESS_TOKEN"
  );

  const graphVersion = getEnv(
    "WHATSAPP_GRAPH_API_VERSION"
  );

  const openAiApiKey = getEnv(
    "OPENAI_API_KEY"
  );

  console.log(
    "Descargando audio de WhatsApp:",
    audioId
  );

  // 1. Obtener URL temporal del audio
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
    const errorText =
      await mediaResponse.text();

    throw new Error(
      `No se pudo obtener el archivo de audio de WhatsApp: ${errorText}`
    );
  }

  const media =
    (await mediaResponse.json()) as {
      url?: string;
      mime_type?: string;
    };

  if (!media.url) {
    throw new Error(
      "WhatsApp no devolvió una URL para el audio."
    );
  }

  // 2. Descargar el archivo
  const audioResponse = await fetch(
    media.url,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!audioResponse.ok) {
    const errorText =
      await audioResponse.text();

    throw new Error(
      `No se pudo descargar el audio de WhatsApp: ${errorText}`
    );
  }

  const audioBuffer =
    await audioResponse.arrayBuffer();

  const mimeType =
    media.mime_type || "audio/ogg";

  // 3. Preparar audio para OpenAI
  const form = new FormData();

  form.append(
    "file",
    new Blob(
      [audioBuffer],
      {
        type: mimeType,
      }
    ),
    "whatsapp-audio.ogg"
  );

  form.append(
    "model",
    "gpt-4o-mini-transcribe"
  );

  form.append("language", "es");

  form.append(
    "prompt",
    `Audio en español argentino sobre finanzas personales.

Puede contener jerga argentina como:
lucas, guita, mangos, palo, palos, plata,
me gasté, gasté, pagué, compré,
cobré, me entró, me pagaron,
me separé, guardé, ahorré.

El usuario puede hablar sobre gastos, ingresos,
ahorros y objetivos financieros.`
  );

  console.log(
    "Enviando audio a OpenAI para transcripción..."
  );

  // 4. Transcribir
  const transcriptionResponse =
    await fetch(
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
    const errorText =
      await transcriptionResponse.text();

    throw new Error(
      `No se pudo transcribir el audio: ${errorText}`
    );
  }

  const transcription =
    (await transcriptionResponse.json()) as {
      text?: string;
    };

  const text =
    transcription.text?.trim();

  if (!text) {
    throw new Error(
      "La transcripción llegó vacía."
    );
  }

  console.log(
    "Audio transcripto correctamente:",
    text
  );

  return text;
}

// =====================================================
// BUSCAR USUARIO VINCULADO
// =====================================================

async function findConnectedUserId(
  phone: string
) {
  const supabase = getAdminClient();

  const normalizedPhone =
    normalizePhone(phone);

  const { data, error } =
    await supabase
      .from("whatsapp_connections")
      .select("user_id")
      .eq(
        "phone_number",
        normalizedPhone
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      `Error buscando la conexión de WhatsApp: ${error.message}`
    );
  }

  return data?.user_id ?? null;
}

// =====================================================
// VINCULAR WHATSAPP
// =====================================================

async function linkWhatsAppWithCode(
  phone: string,
  code: string
) {
  const supabase = getAdminClient();

  const normalizedPhone =
    normalizePhone(phone);

  console.log(
    "Intentando vincular WhatsApp:",
    {
      phone: normalizedPhone,
      code,
    }
  );

  const {
    data: linkCode,
    error: linkCodeError,
  } = await supabase
    .from("whatsapp_link_codes")
    .select(
      "id, user_id, expires_at, used_at"
    )
    .eq("code", code)
    .maybeSingle();

  if (linkCodeError) {
    throw new Error(
      `Error buscando código de vinculación: ${linkCodeError.message}`
    );
  }

  if (!linkCode) {
    return {
      success: false,
      message:
        "Ese código de vinculación no existe o ya no es válido.",
    };
  }

  if (linkCode.used_at) {
    return {
      success: false,
      message:
        "Ese código de vinculación ya fue utilizado.",
    };
  }

  if (
    new Date(
      linkCode.expires_at
    ).getTime() <= Date.now()
  ) {
    return {
      success: false,
      message:
        "Ese código venció. Generá uno nuevo desde HormiGUITA.",
    };
  }

  // Comprobar si pertenece a otro usuario
  const {
    data: existingPhone,
    error: phoneError,
  } = await supabase
    .from("whatsapp_connections")
    .select("user_id")
    .eq(
      "phone_number",
      normalizedPhone
    )
    .maybeSingle();

  if (phoneError) {
    throw new Error(
      `Error comprobando el número: ${phoneError.message}`
    );
  }

  if (
    existingPhone &&
    existingPhone.user_id !==
      linkCode.user_id
  ) {
    return {
      success: false,
      message:
        "Este número de WhatsApp ya está vinculado a otra cuenta de HormiGUITA.",
    };
  }

  // Eliminar conexión anterior del usuario
  const {
    error: deleteOldConnectionError,
  } = await supabase
    .from("whatsapp_connections")
    .delete()
    .eq(
      "user_id",
      linkCode.user_id
    );

  if (deleteOldConnectionError) {
    throw new Error(
      `Error eliminando conexión anterior: ${deleteOldConnectionError.message}`
    );
  }

  // Crear nueva conexión
  const {
    error: insertConnectionError,
  } = await supabase
    .from("whatsapp_connections")
    .insert({
      user_id: linkCode.user_id,
      phone_number: normalizedPhone,
    });

  if (insertConnectionError) {
    throw new Error(
      `Error creando conexión de WhatsApp: ${insertConnectionError.message}`
    );
  }

  // Marcar códigos como utilizados
  const { error: usedError } =
    await supabase
      .from("whatsapp_link_codes")
      .update({
        used_at:
          new Date().toISOString(),
      })
      .eq(
        "user_id",
        linkCode.user_id
      )
      .is("used_at", null);

  if (usedError) {
    throw new Error(
      `Error marcando código como utilizado: ${usedError.message}`
    );
  }

  console.log(
    "WhatsApp vinculado correctamente:",
    {
      userId: linkCode.user_id,
      phone: normalizedPhone,
    }
  );

  return {
    success: true,
    userId: linkCode.user_id,
  };
}

// =====================================================
// OBJETIVOS
// =====================================================

async function getGoals(
  userId: string
) {
  const supabase = getAdminClient();

  const { data, error } =
    await supabase
      .from("goals")
      .select(
        "id, name, currency, current_amount_ars, target_amount"
      )
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw new Error(
      `Error cargando objetivos: ${error.message}`
    );
  }

  return data ?? [];
}

function findGoalByPhrase<
  T extends {
    id: string;
    name: string;
  }
>(
  goals: T[],
  phrase: string
) {
  const target =
    normalizeText(phrase);

  if (!target) {
    return null;
  }

  const exact = goals.find(
    (goal) =>
      normalizeText(goal.name) ===
      target
  );

  if (exact) {
    return exact;
  }

  const contained = goals.find(
    (goal) => {
      const goalName =
        normalizeText(goal.name);

      return (
        goalName.includes(target) ||
        target.includes(goalName)
      );
    }
  );

  return contained ?? null;
}

// =====================================================
// APORTAR A OBJETIVO
// =====================================================

async function applyContribution(params: {
  userId: string;
  goalId: string;
  amountARS: number;
  description: string;
  source:
    | "whatsapp_text"
    | "whatsapp_audio";
  externalMessageId: string;
}) {
  const supabase = getAdminClient();

  const { data, error } =
    await supabase.rpc(
      "apply_whatsapp_goal_contribution",
      {
        p_user_id: params.userId,
        p_goal_id: params.goalId,
        p_amount_ars: params.amountARS,
        p_description:
          params.description,
        p_source: params.source,
        p_external_message_id:
          params.externalMessageId ||
          null,
      }
    );

  if (error) {
    throw new Error(
      `No se pudo registrar el aporte: ${error.message}`
    );
  }

  return data;
}

// =====================================================
// CATEGORÍAS DEL USUARIO
// =====================================================

async function getUserCategories(
  userId: string
) {
  const supabase = getAdminClient();

  const { data, error } =
    await supabase
      .from("categories")
      .select(
        "id, user_id, name, type, icon"
      )
      .eq("user_id", userId);

  if (error) {
    throw new Error(
      `Error cargando categorías: ${error.message}`
    );
  }

  return data ?? [];
}

function findCategory(
  categories: Array<{
    id: string;
    name: string;
    type: string;
  }>,
  name: string,
  type: "income" | "expense"
) {
  const targetName =
    normalizeText(name);

  // Buscar primero coincidencia exacta
  const exact = categories.find(
    (category) =>
      category.type === type &&
      normalizeText(category.name) ===
        targetName
  );

  if (exact) {
    return exact;
  }

  // Buscar coincidencia parcial
  const partial = categories.find(
    (category) =>
      category.type === type &&
      (
        normalizeText(category.name).includes(
          targetName
        ) ||
        targetName.includes(
          normalizeText(category.name)
        )
      )
  );

  if (partial) {
    return partial;
  }

  // Fallback a Otros
  return (
    categories.find(
      (category) =>
        category.type === type &&
        normalizeText(category.name) ===
          "otros"
    ) ?? null
  );
}

// =====================================================
// EVITAR DUPLICADOS
// =====================================================

async function transactionAlreadyExists(
  externalMessageId: string
) {
  if (!externalMessageId) {
    return false;
  }

  const supabase = getAdminClient();

  const { data, error } =
    await supabase
      .from("transactions")
      .select("id")
      .eq(
        "external_message_id",
        externalMessageId
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      `Error comprobando mensaje duplicado: ${error.message}`
    );
  }

  return Boolean(data);
}

// =====================================================
// CREAR TRANSACCIÓN NORMAL
// =====================================================

async function createTransaction(params: {
  userId: string;
  categoryId: string | null;
  type: "income" | "expense";
  amount: number;
  description: string;
  source:
    | "whatsapp_text"
    | "whatsapp_audio";
  originalMessage: string;
  externalMessageId: string;
}) {
  const supabase = getAdminClient();

  // Evitar que WhatsApp registre
  // el mismo mensaje dos veces.
  const alreadyExists =
    await transactionAlreadyExists(
      params.externalMessageId
    );

  if (alreadyExists) {
    return {
      duplicate: true,
    };
  }

  const { data, error } =
    await supabase
      .from("transactions")
      .insert({
        user_id: params.userId,

        category_id:
          params.categoryId,

        type: params.type,

        amount: params.amount,

        description:
          params.description,

        source: params.source,

        original_message:
          params.originalMessage,

        transaction_date:
          new Date().toISOString(),

        goal_id: null,

        is_goal_contribution: false,

        external_message_id:
          params.externalMessageId ||
          null,
      })
      .select(
        "id, amount, type, description, transaction_date"
      )
      .single();

  if (error) {
    throw new Error(
      `No se pudo registrar el movimiento: ${error.message}`
    );
  }

  return {
    duplicate: false,
    transaction: data,
  };
}

// =====================================================
// ENVIAR MENSAJE WHATSAPP
// =====================================================

async function sendWhatsAppText(
  to: string,
  text: string
) {
  const accessToken = getEnv(
    "WHATSAPP_ACCESS_TOKEN"
  );

  const phoneNumberId = getEnv(
    "WHATSAPP_PHONE_NUMBER_ID"
  );

  const graphVersion = getEnv(
    "WHATSAPP_GRAPH_API_VERSION"
  );

  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${accessToken}`,

        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        messaging_product:
          "whatsapp",

        to,

        type: "text",

        text: {
          body: text,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `No se pudo responder por WhatsApp: ${errorText}`
    );
  }
}

// =====================================================
// PROCESAR MENSAJE FINANCIERO NORMAL
// =====================================================

async function processFinancialTransaction(
  params: {
    userId: string;
    text: string;
    source:
      | "whatsapp_text"
      | "whatsapp_audio";
    messageId: string;
    phone: string;
  }
) {
  const {
    userId,
    text,
    source,
    messageId,
    phone,
  } = params;

  const amount =
    parseAmount(text);

  if (!amount) {
    await sendWhatsAppText(
      phone,
      `No pude identificar el monto. 🐜

Podés decirme por ejemplo:

• "Gasté 20 lucas en comida"
• "Pagué 50 mil de alquiler"
• "Cobré 500 lucas de sueldo"
• "Me separé 100 lucas para el auto"`
    );

    return;
  }

  const type =
    detectTransactionType(text);

  if (!type) {
    await sendWhatsAppText(
      phone,
      `Entendí el monto de ${formatARS(
        amount
      )}, pero no pude saber si fue un gasto o un ingreso. 🐜

Probá diciendo algo como:

• "Gasté ${formatARS(
        amount
      )} en comida"

o

• "Cobré ${formatARS(
        amount
      )} por mi trabajo"`
    );

    return;
  }

  const categoryName =
    detectCategoryName(
      text,
      type
    );

  const categories =
    await getUserCategories(userId);

  const category =
    findCategory(
      categories,
      categoryName,
      type
    );

  const description =
    createDescription(
      text,
      amount
    );

  const result =
    await createTransaction({
      userId,

      categoryId:
        category?.id ?? null,

      type,

      amount,

      description,

      source,

      originalMessage: text,

      externalMessageId:
        messageId,
    });

  if (result.duplicate) {
    console.log(
      "Mensaje duplicado ignorado:",
      messageId
    );

    return;
  }

  const categoryLabel =
    category?.name ??
    categoryName;

  if (type === "expense") {
    await sendWhatsAppText(
      phone,
      `Listo. 💸🐜 Registré un gasto de ${formatARS(
        amount
      )}.

📂 Categoría: ${categoryLabel}
📝 ${description}`
    );

    return;
  }

  await sendWhatsAppText(
    phone,
    `Listo. 💰🐜 Registré un ingreso de ${formatARS(
      amount
    )}.

📂 Categoría: ${categoryLabel}
📝 ${description}`
  );
}

// =====================================================
// PROCESAR MENSAJE
// =====================================================

async function processIncomingMessage(
  message: ReturnType<
    typeof extractWhatsAppMessage
  >
) {
  if (
    !message?.id ||
    !message.from
  ) {
    return;
  }

  console.log(
    "Procesando mensaje de WhatsApp:",
    {
      from: message.from,
      type: message.type,
      text: message.text,
    }
  );

  let userId =
    await findConnectedUserId(
      message.from
    );

  // =====================================================
  // VINCULACIÓN POR CÓDIGO
  // =====================================================

  if (
    !userId &&
    message.type === "text" &&
    message.text
  ) {
    const linkCode =
      extractLinkCode(
        message.text
      );

    console.log(
      "Código detectado:",
      linkCode
    );

    if (linkCode) {
      const result =
        await linkWhatsAppWithCode(
          message.from,
          linkCode
        );

      if (!result.success) {
        await sendWhatsAppText(
          message.from,
          result.message ||
            "No se pudo vincular tu WhatsApp."
        );

        return;
      }

      await sendWhatsAppText(
        message.from,
        "¡Listo! 🐜🎉 Tu WhatsApp quedó conectado correctamente con tu cuenta de HormiGUITA.\n\nAhora podés enviarme gastos, ingresos y ahorros por acá.\n\nEjemplos:\n• Gasté 20 lucas en comida\n• Cobré 500 lucas de sueldo\n• Me separé 100 lucas para el auto"
      );

      return;
    }
  }

  // =====================================================
  // WHATSAPP SIN VINCULAR
  // =====================================================

  if (!userId) {
    await sendWhatsAppText(
      message.from,
      "Tu WhatsApp todavía no está conectado a una cuenta de HormiGUITA. 🐜\n\nEntrá a Mi cuenta en la app, generá un código de vinculación y enviámelo por acá."
    );

    return;
  }

  // =====================================================
  // OBTENER TEXTO O TRANSCRIBIR AUDIO
  // =====================================================

  let text: string | null = null;

  let source:
    | "whatsapp_text"
    | "whatsapp_audio";

  if (
    message.type === "text" &&
    message.text
  ) {
    text =
      message.text.trim();

    source =
      "whatsapp_text";
  } else if (
    message.type === "audio" &&
    message.audioId
  ) {
    await sendWhatsAppText(
      message.from,
      "🎙️🐜 Recibí tu audio. Dame un segundo que lo proceso..."
    );

    text =
      await transcribeWhatsAppAudio(
        message.audioId
      );

    source =
      "whatsapp_audio";

    console.log(
      "Texto obtenido del audio:",
      text
    );
  } else {
    await sendWhatsAppText(
      message.from,
      "Por ahora puedo procesar mensajes de texto y audios sobre tus finanzas. 🐜"
    );

    return;
  }

  if (!text) {
    await sendWhatsAppText(
      message.from,
      "No pude obtener el contenido del mensaje. Probá nuevamente."
    );

    return;
  }

  // =====================================================
  // OBJETIVOS / AHORROS
  // =====================================================

  if (looksLikeGoalSaving(text)) {
    const amount =
      parseAmount(text);

    const goalPhrase =
      extractGoalPhrase(text);

    if (!amount || !goalPhrase) {
      await sendWhatsAppText(
        message.from,
        "Entendí que querés registrar un ahorro, pero me faltó identificar el monto o el objetivo.\n\nProbá con:\n“Me separé 200 lucas para el auto”"
      );

      return;
    }

    const goals =
      await getGoals(userId);

    const goal =
      findGoalByPhrase(
        goals,
        goalPhrase
      );

    if (!goal) {
      const availableGoals =
        goals
          .slice(0, 5)
          .map(
            (item) =>
              `• ${item.name}`
          )
          .join("\n");

      const suffix =
        availableGoals
          ? `\n\nTus objetivos actuales:\n${availableGoals}`
          : "\n\nTodavía no tenés objetivos creados.";

      await sendWhatsAppText(
        message.from,
        `No encontré un objetivo llamado “${goalPhrase}”.${suffix}`
      );

      return;
    }

    const updatedGoal =
      await applyContribution({
        userId,

        goalId: goal.id,

        amountARS: amount,

        description:
          `Ahorro para ${goal.name}`,

        source,

        externalMessageId:
          message.id,
      });

    const updatedAmountARS =
      Number(
        updatedGoal?.current_amount_ars ??
          Number(
            goal.current_amount_ars ?? 0
          ) + amount
      );

    await sendWhatsAppText(
      message.from,
      `Listo. ⭐🐜 Sumé ${formatARS(
        amount
      )} a tu objetivo “${goal.name}”.

Ahorro acumulado: ${formatARS(
        updatedAmountARS
      )}`
    );

    return;
  }

  // =====================================================
  // GASTOS / INGRESOS
  // =====================================================

  await processFinancialTransaction({
    userId,

    text,

    source,

    messageId:
      message.id,

    phone:
      message.from,
  });
}

// =====================================================
// VERIFICACIÓN WEBHOOK META
// =====================================================

export async function GET(
  request: NextRequest
) {
  const searchParams =
    request.nextUrl.searchParams;

  const mode =
    searchParams.get("hub.mode");

  const token =
    searchParams.get(
      "hub.verify_token"
    );

  const challenge =
    searchParams.get(
      "hub.challenge"
    );

  const verifyToken =
    process.env.WHATSAPP_VERIFY_TOKEN;

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
          "Content-Type":
            "text/plain",
        },
      }
    );
  }

  return NextResponse.json(
    {
      error:
        "Token de verificación inválido",
    },
    {
      status: 403,
    }
  );
}

// =====================================================
// WEBHOOK POST
// =====================================================

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    console.log(
      "WhatsApp webhook recibido:",
      JSON.stringify(body)
    );

    const message =
      extractWhatsAppMessage(
        body
      );

    if (message) {
      await processIncomingMessage(
        message
      );
    } else {
      console.log(
        "Webhook recibido sin mensaje procesable."
      );
    }

    return NextResponse.json(
      {
        received: true,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Error procesando webhook de WhatsApp:",
      error
    );

    return NextResponse.json(
      {
        received: true,
      },
      {
        status: 200,
      }
    );
  }
}