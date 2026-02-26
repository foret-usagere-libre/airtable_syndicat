type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

type AirtableListResponse = {
  records?: AirtableRecord[];
  offset?: string;
  error?: { type?: string; message?: string };
};

export type ParcelleMere = {
  id: string;
  nom: string;
  surfaceHa?: number;
  proprietaires: string[];
  cadastreIds: string[];
};

export type CadastreListItem = {
  id: string;
  section: string;
  numero: string;
  part: string;
  surface?: number;
};

export type CadastreDetail = CadastreListItem & {
  proprietaires: string[];
  personnes: string[];
  notes: string;
  villes: string[];
  emails: string[];
  telephones: string[];
};

const TABLES = {
  parcellesMeres: "🗺 Parcelles Mères",
  cadastre: "📝 Cadastre",
} as const;

const AIRTABLE_RECORD_ID_REGEX = /^rec[a-zA-Z0-9]{14}$/;
const CADASTRE_SEARCH_FIELDS = [
  "Section",
  "Num",
  "Part",
  "Notes",
  "Personnes",
  "🌳 Propriétaires",
  "Ville",
  "e-mail",
  "téléphone",
  "téléphone 2",
] as const;

function getConfig() {
  const token = process.env.AIRTABLE_API_TOKEN?.trim();
  const baseId = process.env.AIRTABLE_BASE_ID?.trim();

  if (!token || !baseId) {
    throw new Error("Variables d'environnement Airtable manquantes.");
  }

  return { token, baseId };
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => str(item)).filter(Boolean);
  }
  const single = str(value);
  return single ? [single] : [];
}

async function airtableList(
  tableName: string,
  options: {
    maxRecords?: number;
    pageSize?: number;
    filterByFormula?: string;
    fields?: string[];
  } = {}
): Promise<AirtableRecord[]> {
  const { token, baseId } = getConfig();
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    if (options.maxRecords) params.set("maxRecords", String(options.maxRecords));
    if (options.pageSize) params.set("pageSize", String(options.pageSize));
    if (options.filterByFormula) params.set("filterByFormula", options.filterByFormula);
    if (options.fields) {
      for (const field of options.fields) {
        params.append("fields[]", field);
      }
    }
    if (offset) params.set("offset", offset);

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?${params.toString()}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = (await response.json()) as AirtableListResponse;

    if (!response.ok) {
      const message = payload?.error?.message || payload?.error?.type || "Airtable error";
      throw new Error(message);
    }

    records.push(...(payload.records ?? []));
    offset = payload.offset;
  } while (offset);

  return records;
}

function mapCadastre(record: AirtableRecord): CadastreListItem {
  return {
    id: record.id,
    section: str(record.fields["Section"]),
    numero: str(record.fields["Num"]),
    part: str(record.fields["Part"]),
    surface: num(record.fields["Surface"]),
  };
}

function mapParcelleMere(record: AirtableRecord): ParcelleMere {
  return {
    id: record.id,
    nom: str(record.fields["Nom Parcelle Mère"]),
    surfaceHa: num(record.fields["Surface ha"]),
    proprietaires: toStringArray(record.fields["Propriétaires"]),
    cadastreIds: toStringArray(record.fields["Cadastre"]),
  };
}

function isValidRecordId(id: string): boolean {
  return AIRTABLE_RECORD_ID_REGEX.test(id);
}

function escapeAirtableFormulaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ");
}

export async function listParcellesMeres(): Promise<ParcelleMere[]> {
  const records = await airtableList(TABLES.parcellesMeres, {
    pageSize: 100,
    fields: ["Nom Parcelle Mère", "Surface ha", "Propriétaires", "Cadastre"],
  });

  return records
    .map(mapParcelleMere)
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }));
}

export async function getParcelleMereById(id: string): Promise<ParcelleMere | null> {
  if (!isValidRecordId(id)) return null;

  const records = await airtableList(TABLES.parcellesMeres, {
    maxRecords: 1,
    filterByFormula: `RECORD_ID()='${id}'`,
    fields: ["Nom Parcelle Mère", "Surface ha", "Propriétaires", "Cadastre"],
  });
  return records[0] ? mapParcelleMere(records[0]) : null;
}

export async function listCadastresByIds(ids: string[]): Promise<CadastreListItem[]> {
  const validIds = ids.filter((id) => isValidRecordId(id));
  if (validIds.length === 0) return [];

  const formulas: string[] = [];
  const chunks: string[][] = [];
  for (let index = 0; index < validIds.length; index += 30) {
    chunks.push(validIds.slice(index, index + 30));
  }

  for (const chunk of chunks) {
    formulas.push(`OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`);
  }

  const all: AirtableRecord[] = [];
  for (const formula of formulas) {
    const part = await airtableList(TABLES.cadastre, {
      filterByFormula: formula,
      pageSize: 100,
      fields: ["Section", "Num", "Part", "Surface"],
    });
    all.push(...part);
  }

  return all
    .map(mapCadastre)
    .sort(
      (a, b) =>
        a.section.localeCompare(b.section, "fr", { sensitivity: "base" }) ||
        a.numero.localeCompare(b.numero, "fr", { sensitivity: "base" })
    );
}

export async function getCadastreById(id: string): Promise<CadastreDetail | null> {
  if (!isValidRecordId(id)) return null;

  const records = await airtableList(TABLES.cadastre, {
    maxRecords: 1,
    filterByFormula: `RECORD_ID()='${id}'`,
    fields: [
      "Section",
      "Num",
      "Part",
      "Surface",
      "Notes",
      "Personnes",
      "🌳 Propriétaires",
      "Ville",
      "e-mail",
      "téléphone",
      "téléphone 2",
    ],
  });

  const record = records[0];
  if (!record) return null;

  return {
    ...mapCadastre(record),
    proprietaires: toStringArray(record.fields["🌳 Propriétaires"]),
    personnes: toStringArray(record.fields["Personnes"]),
    notes: str(record.fields["Notes"]),
    villes: toStringArray(record.fields["Ville"]),
    emails: toStringArray(record.fields["e-mail"]),
    telephones: [
      ...toStringArray(record.fields["téléphone"]),
      ...toStringArray(record.fields["téléphone 2"]),
    ],
  };
}

export async function searchCadastres(query: string): Promise<CadastreListItem[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const escaped = escapeAirtableFormulaString(q);
  const filterByFormula = `OR(${CADASTRE_SEARCH_FIELDS.map(
    (field) => `FIND("${escaped}", LOWER({${field}} & "")) > 0`
  ).join(",")})`;

  const records = await airtableList(TABLES.cadastre, {
    pageSize: 100,
    filterByFormula,
    fields: ["Section", "Num", "Part", "Surface"],
  });

  return records
    .map(mapCadastre)
    .sort(
      (a, b) =>
        a.section.localeCompare(b.section, "fr", { sensitivity: "base" }) ||
        a.numero.localeCompare(b.numero, "fr", { sensitivity: "base" })
    );
}
