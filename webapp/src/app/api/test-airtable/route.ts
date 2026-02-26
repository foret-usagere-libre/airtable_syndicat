import { NextResponse } from "next/server";
import Airtable from "airtable";

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
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}