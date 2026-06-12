"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadNav } from "@/lib/cadastre-nav";

type NavState = {
  ids: string[];
  index: number;
};

export default function CadastreNavBar({ currentId }: { currentId: string }) {
  const router = useRouter();
  const [nav, setNav] = useState<NavState | null>(null);

  useEffect(() => {
    const ctx = loadNav();
    if (!ctx || !ctx.ids.includes(currentId)) return;
    const index = ctx.ids.indexOf(currentId);
    setNav({ ids: ctx.ids, index });
  }, [currentId]);

  if (!nav) return null;

  const { ids, index } = nav;
  const total = ids.length;
  const prevIndex = (index - 1 + total) % total;
  const nextIndex = (index + 1) % total;

  function go(targetIndex: number) {
    if (!nav) return;
    const newIds = nav.ids;
    sessionStorage.setItem("cadastreNav", JSON.stringify({ ids: newIds, index: targetIndex }));
    router.push(`/cadastres/${newIds[targetIndex]}`);
  }

  return (
    <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
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
  );
}
