import { NextResponse } from "next/server";

type DolarApiResponse = {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
};

export async function GET() {
  try {
    const response = await fetch(
      "https://dolarapi.com/v1/dolares/oficial",
      {
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "No se pudo obtener la cotización del dólar.",
        },
        { status: 502 }
      );
    }

    const data =
      (await response.json()) as DolarApiResponse;

    if (
      typeof data.venta !== "number" ||
      !data.fechaActualizacion
    ) {
      return NextResponse.json(
        {
          error: "La cotización recibida no tiene un formato válido.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      currency: "USD",
      type: "official_sell",
      rate: data.venta,
      source: "DolarAPI",
      sourceName: "Dólar oficial",
      updatedAt: data.fechaActualizacion,
    });
  } catch (error) {
    console.error("Error obteniendo cotización:", error);

    return NextResponse.json(
      {
        error: "Error interno al obtener la cotización.",
      },
      { status: 500 }
    );
  }
}