"use client";

import Link from "next/link";
import { saveNav } from "@/lib/cadastre-nav";

type CadastreItem = {
  id: string;
  section?: string;
  numero?: string;
  part?: string;
  surface?: number;
};

export default function CadastreList({ items }: { items: CadastreItem[] }) {
  const ids = items.map((i) => i.id);

  return (
    <ul className="space-y-2">
      {items.map((cadastre, index) => (
        <li key={cadastre.id}>
          <Link
            href={`/cadastres/${cadastre.id}`}
            onClick={() => saveNav(ids, index)}
            className="block rounded-lg border border-slate-200 bg-[#efefef] p-3"
          >
            <p className="font-medium">
              {cadastre.section || "?"} {cadastre.numero || ""}
              {cadastre.part ? ` - ${cadastre.part}` : ""}
            </p>
            <p className="text-sm text-slate-600">
              {cadastre.surface ? `${cadastre.surface} m²` : "Surface inconnue"}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
