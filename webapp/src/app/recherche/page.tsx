import Link from "next/link";
import { searchCadastres } from "@/lib/airtable";
import CadastreList from "@/components/cadastre-list";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function RecherchePage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query.length >= 2 ? await searchCadastres(query) : [];

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-slate-50 p-4">
      <Link href="/" className="mb-4 inline-block text-sm text-slate-700 underline">
        ← Retour à l&apos;accueil
      </Link>

      <h1 className="mb-2 text-2xl font-semibold">Recherche globale</h1>
      <form action="/recherche" className="mb-4 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Au moins 2 caractères"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Rechercher
        </button>
      </form>

      {query.length > 0 && query.length < 2 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Saisissez au moins 2 caractères.
        </p>
      ) : null}

      {query.length >= 2 ? (
        <p className="mb-3 text-sm text-slate-600">{results.length} résultat(s)</p>
      ) : null}

      <CadastreList items={results} />
    </main>
  );
}
