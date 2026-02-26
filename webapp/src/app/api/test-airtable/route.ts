import { NextResponse } from "next/server";
import Airtable from "airtable";

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

export async function GET() {
  try {
    const token = process.env.AIRTABLE_API_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!token || !baseId) {
      return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
    }

    Airtable.configure({ apiKey: token });
    const base = Airtable.base(baseId);

    const records = await base("🗺 Parcelles Mères")
      .select({ maxRecords: 5 })
      .firstPage();

    return NextResponse.json({
      ok: true,
      count: records.length,
      items: records.map((r) => ({ id: r.id, fields: r.fields })),
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      envCheck: {
        hasAirtableToken: Boolean(process.env.AIRTABLE_API_TOKEN),
        hasBaseId: Boolean(process.env.AIRTABLE_BASE_ID),
      },
      error: formatError(error),
    }, { status: 500 });
  }
}
