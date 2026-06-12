"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadNav, saveNav } from "@/lib/cadastre-nav";

type NavState = {
  ids: string[];
  index: number;
  backUrl: string;
};

export default function CadastreNavBar({ currentId }: { currentId: string }) {
  const router = useRouter();
  const [nav, setNav] = useState<NavState | null>(null);

  useEffect(() => {
    const ctx = loadNav();
    if (!ctx || !ctx.ids.includes(currentId)) return;
    setNav({ ids: ctx.ids, index: ctx.ids.indexOf(currentId), backUrl: ctx.backUrl });
  }, [currentId]);

  function go(targetIndex: number) {
    if (!nav) return;
    saveNav(nav.ids, targetIndex, nav.backUrl);
    router.push(`/cadastres/${nav.ids[targetIndex]}`);
  }

  const backLink = nav ? (
    <Link href={nav.backUrl} className="text-sm text-slate-700 underline">
      ← Retour à la liste
    </Link>
  ) : (
    <Link href="/" className="text-sm text-slate-700 underline">
      ← Retour accueil
    </Link>
  );

  if (!nav) return <div className="mb-4">{backLink}</div>;

  const { ids, index } = nav;
  const total = ids.length;
  const prevIndex = (index - 1 + total) % total;
  const nextIndex = (index + 1) % total;

  return (
    <div className="mb-4 space-y-3">
      {backLink}
      <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
        <button
          onClick={() => go(prevIndex)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-95"
          aria-label="Précédent"
        >
          ← Préc.
        </button>
        <span className="text-sm text-slate-500">
          {index + 1} / {total}
        </span>
        <button
          onClick={() => go(nextIndex)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-95"
          aria-label="Suivant"
        >
          Suiv. →
        </button>
      </div>
    </div>
  );
}
