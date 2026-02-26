import Link from "next/link";
import { listParcellesMeres } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export default async function ParcellesMeresPage() {
  const parcelles = await listParcellesMeres();

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-slate-50 p-4">
      <Link href="/" className="mb-4 inline-block text-sm text-slate-700 underline">
        ← Retour accueil
      </Link>
      <h1 className="mb-3 text-2xl font-semibold">Parcelles mères</h1>
      <p className="mb-4 text-sm text-slate-600">Sélectionnez une parcelle mère pour voir ses sections cadastrales.</p>

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
