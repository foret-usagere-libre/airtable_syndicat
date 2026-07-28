"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import type { CadastreSearchItem } from "@/lib/airtable";
import { normalizeText } from "@/lib/text";
import { saveNav, loadNav, CADASTRE_NAV_KEY } from "@/lib/cadastre-nav";

type Props = {
  initialItems: CadastreSearchItem[];
  userEmail?: string;
};

export default function CadastreSearchPanel({ initialItems, userEmail }: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const ctx = loadNav();
    if (ctx?.backUrl === "/" && ctx.backQuery !== undefined) {
      setQuery(ctx.backQuery);
      sessionStorage.removeItem(CADASTRE_NAV_KEY);
    }
  }, []);

  const normalizedQuery = normalizeText(query);
  const filtered = useMemo(() => {
    if (!normalizedQuery) return initialItems;
    return initialItems.filter((item) => item.searchText.includes(normalizedQuery));
  }, [initialItems, normalizedQuery]);

  return (
    <section className="rounded-[22px] border border-white/20 bg-[#5a5a5a]/96 px-4 py-6 text-white shadow-xl backdrop-blur-[1px]">
      <h1 className="text-center text-4xl font-semibold leading-none tracking-tight">Cadastre</h1>
      <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-100/95">
        Consultation du rôle des propriétaires de la forêt usagère
      </p>
      {userEmail ? (
        <p className="mt-1 text-center text-sm text-slate-200/95">Pour {userEmail}</p>
      ) : null}

      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-black shadow-sm">
        <span aria-hidden className="text-base text-slate-500">
          🔎
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Recherche"
          className="w-full border-0 bg-transparent text-[1.1rem] outline-none placeholder:text-slate-500"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-base text-slate-500"
            aria-label="Effacer la recherche"
          >
            ✕
          </button>
        ) : null}
      </div>

      <p className="mt-4 text-sm text-slate-100/90">{filtered.length} résultat(s)</p>

      <ul className="mt-3 space-y-3">
        {filtered.map((item, index) => (
          <li key={item.id}>
            <Link
              href={`/cadastres/${item.id}`}
              onClick={() => saveNav(filtered.map((i) => i.id), index, "/", query)}
              className="block rounded-2xl border border-slate-300/60 bg-[#f3f4f6] p-4 text-slate-900 shadow-sm transition hover:bg-white active:scale-[0.995]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[2rem] leading-none font-semibold tracking-tight">{item.code}</p>
                <p className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {item.surface ? `${Math.round(item.surface)} m²` : "—"}
                </p>
              </div>
              <p className="mt-3 text-lg font-medium text-slate-900">
                {item.lieuDit || "Parcelle mère non renseignée"}
              </p>
              <p className="mt-1 text-[1.05rem] text-slate-700">
                {item.proprietaire || "Propriétaire non renseigné"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
