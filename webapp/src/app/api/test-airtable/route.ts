import { NextResponse } from "next/server";

function formatError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    return {
      message: typeof record.error === "string" ? record.error : "Unknown object error",
      type: typeof record.type === "string" ? record.type : undefined,
      statusCode:
        typeof record.statusCode === "number" ? record.statusCode : undefined,
      details: record,
    };
  }

  return { message: String(error) };
}

type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const token = process.env.AIRTABLE_API_TOKEN?.trim();
    const baseId = process.env.AIRTABLE_BASE_ID?.trim();
    if (!token || !baseId) {
      return NextResponse.json({ ok: false, error: "Missing env vars" }, { status: 500 });
    }

    const tableName = "🗺 Parcelles Mères";
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?maxRecords=5`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: payload?.error?.type || "Airtable error",
            statusCode: response.status,
          },
        },
        { status: 500 }
      );
    }

    const records: AirtableRecord[] = Array.isArray(payload?.records)
      ? (payload.records as AirtableRecord[])
      : [];

    return NextResponse.json({
      ok: true,
      count: records.length,
      items: records.map((r) => ({ id: r.id, fields: r.fields })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: formatError(error),
      },
      { status: 500 }
    );
  }
}
