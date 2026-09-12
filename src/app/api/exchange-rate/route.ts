import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Quote = {
  buy: number;
  sell: number;
};

function parseNumber(value: string) {
  return Number(value.replace(/\./g, "").replace(",", "."));
}

function extractQuote(text: string, currency: string): Quote {
  const index = text.indexOf(currency);

  if (index === -1) {
    throw new Error(`No se encontró la cotización de ${currency} BNA.`);
  }

  const chunk = text.slice(index, index + 220);
  const values = [
    ...chunk.matchAll(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g),
  ]
    .map((match) => match[0])
    .slice(0, 2);

  if (values.length < 2) {
    throw new Error(`No se encontraron compra y venta de ${currency} BNA.`);
  }

  const buy = parseNumber(values[0]);
  const sell = parseNumber(values[1]);

  if (!Number.isFinite(buy) || !Number.isFinite(sell)) {
    throw new Error(`Cotización inválida para ${currency}.`);
  }

  return { buy, sell };
}

function extractDate(text: string) {
  const match = text.match(
    /(\d{1,2}\/\d{1,2}\/\d{4})\s+Compra\s+Venta/
  );

  return match?.[1] ?? null;
}

function extractUpdateTime(text: string) {
  const match = text.match(/Hora Actualización:\s*(\d{1,2}:\d{2})/);
  return match?.[1] ?? null;
}

function buildUpdatedAt(dateValue: string | null, timeValue: string | null) {
  if (!dateValue || !timeValue) {
    return new Date().toISOString();
  }

  const [day, month, year] = dateValue.split("/").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-03:00`;
}

function cleanHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  try {
    const urls = [
      "https://www.bna.com.ar/Personas",
      "https://bna.com.ar/Personas",
    ];

    let html: string | null = null;
    let lastError = "No se pudo acceder al BNA.";

    for (const url of urls) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(url, {
          cache: "no-store",
          redirect: "follow",
          signal: controller.signal,
          headers: {
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
            Referer: "https://www.bna.com.ar/",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
          },
        });

        if (response.ok) {
          const candidate = await response.text();
          const cleaned = cleanHtml(candidate);

          if (
            cleaned.includes("Dolar U.S.A") &&
            cleaned.includes("Euro") &&
            cleaned.includes("Real *")
          ) {
            html = candidate;
            break;
          }

          lastError = `BNA respondió ${response.status}, pero la página no contiene las cotizaciones esperadas.`;
        } else {
          lastError = `BNA respondió ${response.status}.`;
        }
      } catch (error) {
        lastError =
          error instanceof Error ? error.message : "Error de conexión con BNA.";
      } finally {
        clearTimeout(timeout);
      }
    }

    if (!html) {
      throw new Error(lastError);
    }
    const text = cleanHtml(html);

    const usd = extractQuote(text, "Dolar U.S.A");
    const eur = extractQuote(text, "Euro");
    const realRaw = extractQuote(text, "Real *");

    // BNA publica el Real cada 100 unidades.
    const brl: Quote = {
      buy: realRaw.buy / 100,
      sell: realRaw.sell / 100,
    };

    const date = extractDate(text);
    const time = extractUpdateTime(text);
    const updatedAt = buildUpdatedAt(date, time);

    return NextResponse.json(
      {
        date,
        updatedAt,
        source: "https://bna.com.ar/personas",
        sourceName: "Banco de la Nación Argentina (BNA)",
        currencies: {
          USD: usd,
          EUR: eur,
          BRL: brl,
        },
        // Se mantiene por compatibilidad con cualquier lógica existente
        // que utilice el dólar vendedor como referencia para USD.
        currency: "USD",
        type: "official_sell",
        rate: usd.sell,
        buy: usd.buy,
        sell: usd.sell,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=900, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Error obteniendo cotizaciones BNA:", error);

    return NextResponse.json(
      {
        error: "No se pudieron obtener las cotizaciones del BNA.",
      },
      { status: 502 }
    );
  }
}
