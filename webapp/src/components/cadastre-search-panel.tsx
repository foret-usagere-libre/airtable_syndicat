"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CadastreSearchItem } from "@/lib/airtable";

type Props = {
  initialItems: CadastreSearchItem[];
};

function normalizeQuery(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export default function CadastreSearchPanel({ initialItems }: Props) {
  const [query, setQuery] = useState("");

  const normalizedQuery = normalizeQuery(query);
  const filtered = useMemo(() => {
    if (!normalizedQuery) return initialItems;
    return initialItems.filter((item) => item.searchText.includes(normalizedQuery));
  }, [initialItems, normalizedQuery]);

  return (
    <section className="rounded-2xl bg-[#5d5d5d] px-4 py-6 text-white shadow-sm">
      <h1 className="text-center text-3xl font-semibold tracking-wide">Cadastre</h1>
      <p className="mt-2 text-center text-sm text-slate-200">
        Consultation du rôle des propriétaires de la forêt usagère
      </p>

      <div className="mt-5 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-black">
        <span aria-hidden className="text-sm text-slate-500">
          🔎
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Recherche"
          className="w-full border-0 bg-transparent text-sm outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-sm text-slate-500"
            aria-label="Effacer la recherche"
          >
            ✕
          </button>
        ) : null}
      </div>

      <p className="mt-3 text-xs text-slate-200">{filtered.length} résultat(s)</p>

      <ul className="mt-3 space-y-3">
        {filtered.map((item) => (
          <li key={item.id}>
            <Link
              href={`/cadastres/${item.id}`}
              className="block rounded-xl bg-[#efefef] p-4 text-slate-900 shadow-sm"
            >
              <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-[120px_120px_1fr]">
                <p className="font-semibold">{item.code}</p>
                <p>{item.surface ? `${Math.round(item.surface)} m²` : "—"}</p>
                <p className="font-medium">{item.lieuDit || "Lieu-dit non renseigné"}</p>
              </div>
              <p className="mt-2 text-sm text-slate-700">{item.proprietaire || "Propriétaire non renseigné"}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
