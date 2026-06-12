import Link from "next/link";
import { getParcelleMereById, listCadastresByIds } from "@/lib/airtable";
import CadastreList from "@/components/cadastre-list";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ParcelleMerePage({ params }: PageProps) {
  const { id } = await params;
  const parcelle = await getParcelleMereById(id);

  if (!parcelle) {
    return (
      <main className="mx-auto min-h-screen max-w-xl bg-slate-50 p-4">
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Parcelle mère introuvable.
        </p>
      </main>
    );
  }

  const cadastres = await listCadastresByIds(parcelle.cadastreIds);

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-slate-50 p-4">
      <Link href="/parcelles-meres" className="mb-4 inline-block text-sm text-slate-700 underline">
        ← Retour parcelles mères
      </Link>
      <h1 className="text-2xl font-semibold">{parcelle.nom}</h1>
      <p className="mb-4 text-sm text-slate-600">
        {parcelle.surfaceHa ? `${parcelle.surfaceHa} ha` : "Surface inconnue"}
      </p>

      <h2 className="mb-2 text-lg font-medium">Sections cadastrales</h2>
      <CadastreList items={cadastres} backUrl={`/parcelles-meres/${id}`} />
    </main>
  );
}
