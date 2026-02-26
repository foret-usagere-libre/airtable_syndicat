import Link from "next/link";
import { listParcellesMeres } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export default async function Home() {
  const parcelles = await listParcellesMeres();

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-slate-50 p-4">
      <h1 className="mb-2 text-2xl font-semibold">Parcelles mères</h1>
      <p className="mb-4 text-sm text-slate-600">
        Choisissez une parcelle mère ou lancez une recherche globale.
      </p>

      <form action="/recherche" className="mb-4 flex gap-2">
        <input
          type="text"
          name="q"
          placeholder="Recherche libre dans la base"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Rechercher
        </button>
      </form>

      <ul className="space-y-2">
        {parcelles.map((parcelle) => (
          <li key={parcelle.id}>
            <Link
              href={`/parcelles-meres/${parcelle.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-3"
            >
              <p className="font-medium">{parcelle.nom || "Sans nom"}</p>
              <p className="text-sm text-slate-600">
                {parcelle.surfaceHa ? `${parcelle.surfaceHa} ha` : "Surface inconnue"}
              </p>
              <p className="text-xs text-slate-500">
                {parcelle.cadastreIds.length} section(s) cadastrale(s)
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
