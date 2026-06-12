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

export type CadastreSearchItem = CadastreListItem & {
  code: string;
  lieuDit: string;
  proprietaire: string;
  searchText: string;
};

export type CadastreDetail = CadastreListItem & {
  proprietaires: string[];
  parcelleMere: string;
  parcelleMereId: string;
  notes: string;
  villes: string[];
  emails: string[];
  telephones: string[];
  contactNoms: string[];
  contactEmails: string[];
  contactTelephones: string[];
  contactAdresse: string;
};

const TABLES = {
  parcellesMeres: "🗺 Parcelles Mères",
  cadastre: "📝 Cadastre",
  proprietaires: "🌳 Propriétaires",
  personnes: "👨‍👩‍👧‍👦 Personnes",
  users: "👷🏻‍♂️ Users",
} as const;

export type MagicUser = {
  id: string;
  email: string;
  nom: string;
  status: string;
};

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

function normalizeStatus(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function isUserActive(status: string): boolean {
  return normalizeStatus(status) === "active";
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function firstNonEmpty(fields: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const values = toStringArray(fields[key]);
    if (values.length > 0) {
      return values.join(" · ");
    }
  }
  return "";
}

function toSearchString(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => toSearchString(item)).filter(Boolean).join(" ");
  }
  return str(value);
}

function extractSearchText(fields: Record<string, unknown>, keys: string[]): string {
  return keys.map((key) => toSearchString(fields[key])).filter(Boolean).join(" ");
}

function ownerContactIds(ownerFields: Record<string, unknown> | undefined): string[] {
  if (!ownerFields) return [];
  const mandataires = toStringArray(ownerFields["Mandataire"]).filter((id) => isValidRecordId(id));
  if (mandataires.length > 0) return mandataires;
  return toStringArray(ownerFields["Personnes"]).filter((id) => isValidRecordId(id));
}

async function resolveLinkedRecords(
  tableName: string,
  ids: string[],
  fields: string[]
): Promise<Map<string, Record<string, unknown>>> {
  const uniqueIds = [...new Set(ids.filter((id) => isValidRecordId(id)))];
  const mapping = new Map<string, Record<string, unknown>>();
  if (uniqueIds.length === 0) return mapping;

  for (let index = 0; index < uniqueIds.length; index += 30) {
    const chunk = uniqueIds.slice(index, index + 30);
    const formula = `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(",")})`;
    const records = await airtableList(tableName, {
      pageSize: 100,
      filterByFormula: formula,
      fields,
    });

    for (const record of records) {
      mapping.set(record.id, record.fields);
    }
  }

  return mapping;
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

  const parcelleLinkField =
    "Nom Parcelle Mère (from ID Parcelle Mère) (from Cadastre - Parcelles Mères)";
  const ownerLinkField = "Nom Propriétaire";

  const records = await airtableList(TABLES.cadastre, {
    maxRecords: 1,
    filterByFormula: `RECORD_ID()='${id}'`,
    fields: [
      "Section",
      "Num",
      "Part",
      "Surface",
      "Notes",
      parcelleLinkField,
      ownerLinkField,
      "🌳 Propriétaires",
      "Ville",
      "e-mail",
      "téléphone",
      "téléphone 2",
    ],
  });

  const record = records[0];
  if (!record) return null;

  const parcelleIds = toStringArray(record.fields[parcelleLinkField]);
  const primaryParcelleId = parcelleIds.find((parcelleId) => isValidRecordId(parcelleId));
  const ownerIds = toStringArray(record.fields[ownerLinkField]);
  const primaryOwnerId = ownerIds.find((ownerId) => isValidRecordId(ownerId));

  const [parcelleMap, ownerMap] = await Promise.all([
    resolveLinkedRecords(
      TABLES.parcellesMeres,
      primaryParcelleId ? [primaryParcelleId] : [],
      ["Nom Parcelle Mère"]
    ),
    resolveLinkedRecords(TABLES.proprietaires, primaryOwnerId ? [primaryOwnerId] : [], [
      "Nom Propriétaire",
      "Mandataire",
      "Personnes",
      "e-mail",
      "téléphone 1",
      "téléphone 2",
      "Adresse",
      "CP",
      "Ville",
    ]),
  ]);

  const primaryPersonId = primaryOwnerId ? ownerContactIds(ownerMap.get(primaryOwnerId))[0] : undefined;
  const personIds = primaryPersonId ? [primaryPersonId] : [];
  const personMap = await resolveLinkedRecords(TABLES.personnes, personIds, [
    "Nom",
    "Prénom",
    "Raison Sociale",
    "e-mail",
    "Téléphone 1",
    "Téléphone 2",
    "Adresse",
    "CodePostal",
    "Ville",
  ]);

  const parcelleMere = primaryParcelleId
    ? str(parcelleMap.get(primaryParcelleId)?.["Nom Parcelle Mère"])
    : str(record.fields[parcelleLinkField]);

  const proprietairePrincipal = primaryOwnerId
    ? str(ownerMap.get(primaryOwnerId)?.["Nom Propriétaire"])
    : "";

  const primaryPerson = primaryPersonId ? personMap.get(primaryPersonId) : undefined;
  const contactNom = primaryPerson
    ? str(primaryPerson["Raison Sociale"]) ||
      `${str(primaryPerson["Prénom"])} ${str(primaryPerson["Nom"])}`.trim()
    : "";

  const contactEmails = [
    ...new Set(
      primaryPerson
        ? toStringArray(primaryPerson["e-mail"])
        : []
    ),
  ];

  const contactTelephones = [
    ...new Set(
      primaryPerson
        ? [
            ...toStringArray(primaryPerson["Téléphone 1"]),
            ...toStringArray(primaryPerson["Téléphone 2"]),
          ]
        : []
    ),
  ];

  const contactAdresse = primaryPerson
    ? [
        str(primaryPerson["Adresse"]),
        [str(primaryPerson["CodePostal"]), str(primaryPerson["Ville"])]
          .filter(Boolean)
          .join(" "),
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const fallbackEmails = toStringArray(record.fields["e-mail"]);
  const fallbackPhones = [
    ...toStringArray(record.fields["téléphone"]),
    ...toStringArray(record.fields["téléphone 2"]),
  ];

  return {
    ...mapCadastre(record),
    proprietaires: proprietairePrincipal
      ? [proprietairePrincipal]
      : toStringArray(record.fields["🌳 Propriétaires"]).slice(0, 1),
    parcelleMere,
    parcelleMereId: primaryParcelleId ?? "",
    notes: str(record.fields["Notes"]),
    villes: toStringArray(record.fields["Ville"]),
    emails: contactEmails.length > 0 ? contactEmails : fallbackEmails,
    telephones: contactTelephones.length > 0 ? contactTelephones : fallbackPhones,
    contactNoms: contactNom ? [contactNom] : [],
    contactEmails,
    contactTelephones,
    contactAdresse,
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

export async function listCadastresForHome(): Promise<CadastreSearchItem[]> {
  const records = await airtableList(TABLES.cadastre, {
    pageSize: 100,
    fields: [
      "Section",
      "Num",
      "Part",
      "Surface",
      "Nom Parcelle Mère (from ID Parcelle Mère) (from Cadastre - Parcelles Mères)",
      "🌳 Propriétaires",
      "Nom Propriétaire",
      "Notes",
      "Personnes",
      "Ville",
      "e-mail",
      "téléphone",
      "téléphone 2",
    ],
  });

  const parcelleLinkField =
    "Nom Parcelle Mère (from ID Parcelle Mère) (from Cadastre - Parcelles Mères)";
  const ownerLinkField = "Nom Propriétaire";

  const parcelleIds = records.flatMap((record) => toStringArray(record.fields[parcelleLinkField]));
  const ownerIds = records.flatMap((record) => toStringArray(record.fields[ownerLinkField]));

  const [parcelleNameMap, ownerNameMap] = await Promise.all([
    resolveLinkedRecords(TABLES.parcellesMeres, parcelleIds, [
      "Nom Parcelle Mère",
      "Propriétaires",
      "N° Lot",
    ]),
    resolveLinkedRecords(TABLES.proprietaires, ownerIds, [
      "Nom Propriétaire",
      "Mandataire",
      "Personnes",
      "e-mail",
      "téléphone 1",
      "téléphone 2",
      "Adresse",
      "Ville",
      "CP",
    ]),
  ]);

  const personIds = [...ownerNameMap.values()].flatMap((ownerFields) => ownerContactIds(ownerFields));
  const personMap = await resolveLinkedRecords(TABLES.personnes, personIds, [
    "Nom",
    "Prénom",
    "Raison Sociale",
    "e-mail",
    "Téléphone 1",
    "Téléphone 2",
    "Adresse",
    "Ville",
  ]);

  return records
    .map((record) => {
      const section = str(record.fields["Section"]);
      const numero = str(record.fields["Num"]);
      const part = str(record.fields["Part"]);
      const code = `${section || "?"} ${numero || ""}${part ? ` ${part}` : ""}`.trim();

      const linkedParcelleNames = toStringArray(record.fields[parcelleLinkField])
        .map((id) => str(parcelleNameMap.get(id)?.["Nom Parcelle Mère"]))
        .filter((value): value is string => Boolean(value));
      const lieuDit =
        linkedParcelleNames[0] ||
        firstNonEmpty(record.fields, [parcelleLinkField]);

      const linkedOwnerNames = toStringArray(record.fields[ownerLinkField])
        .map((id) => str(ownerNameMap.get(id)?.["Nom Propriétaire"]))
        .filter((value): value is string => Boolean(value));
      const proprietaire =
        linkedOwnerNames[0] ||
        firstNonEmpty(record.fields, ["🌳 Propriétaires", ownerLinkField]);

      const ownerLinkedIds = toStringArray(record.fields[ownerLinkField]);
      const ownerDetailsText = ownerLinkedIds
        .map((id) =>
          extractSearchText(ownerNameMap.get(id) ?? {}, [
            "Nom Propriétaire",
            "e-mail",
            "téléphone 1",
            "téléphone 2",
            "Adresse",
            "Ville",
            "CP",
          ])
        )
        .filter(Boolean)
        .join(" ");

      const contactLinkedFromOwners = ownerLinkedIds
        .flatMap((id) => ownerContactIds(ownerNameMap.get(id)))
        .map((personId) =>
          extractSearchText(personMap.get(personId) ?? {}, [
            "Nom",
            "Prénom",
            "Raison Sociale",
            "e-mail",
            "Téléphone 1",
            "Téléphone 2",
            "Adresse",
            "Ville",
          ])
        )
        .filter(Boolean)
        .join(" ");

      const parcelleDetailsText = toStringArray(record.fields[parcelleLinkField])
        .map((id) =>
          extractSearchText(parcelleNameMap.get(id) ?? {}, [
            "Nom Parcelle Mère",
            "Propriétaires",
            "N° Lot",
          ])
        )
        .filter(Boolean)
        .join(" ");

      const inlineContactsText = toStringArray(record.fields["Personnes"]).join(" ");

      const searchText = normalizeSearchText(
        [
          code,
          lieuDit,
          proprietaire,
          inlineContactsText,
          ownerDetailsText,
          contactLinkedFromOwners,
          parcelleDetailsText,
          JSON.stringify(record.fields),
        ].join(" ")
      );

      return {
        id: record.id,
        section,
        numero,
        part,
        surface: num(record.fields["Surface"]),
        code,
        lieuDit,
        proprietaire,
        searchText,
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code, "fr", { sensitivity: "base" }));
}

export function normalizeQuery(value: string): string {
  return normalizeSearchText(value);
}

export async function getUserByMagicToken(token: string): Promise<MagicUser | null> {
  const cleanToken = token.trim();
  if (!cleanToken) return null;

  const escapedToken = escapeAirtableFormulaString(cleanToken);
  const formula = `OR({MagicLink}="${escapedToken}", FIND("${escapedToken}", {MagicLink} & "") > 0)`;
  const records = await airtableList(TABLES.users, {
    maxRecords: 1,
    filterByFormula: formula,
    fields: ["Nom", "e-mail", "Status"],
  });
  const record = records[0];
  if (!record) return null;

  return {
    id: record.id,
    email: str(record.fields["e-mail"]),
    nom: str(record.fields["Nom"]),
    status: str(record.fields["Status"]),
  };
}
