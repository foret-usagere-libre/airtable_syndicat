import Link from "next/link";
import CadastreSearchPanel from "@/components/cadastre-search-panel";
import { listCadastresForHome } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cadastres = await listCadastresForHome();

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="h-[320px] w-full bg-[radial-gradient(circle_at_25%_20%,#9cab6f_0,#6f7751_25%,#303330_65%,#1d1f1d_100%)]" />
      <div className="mx-auto -mt-10 max-w-4xl px-4 pb-6">
        <CadastreSearchPanel initialItems={cadastres} />
        <div className="mt-4 text-center">
          <Link
            href="/parcelles-meres"
            className="inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
          >
            Voir la navigation par parcelles mères
          </Link>
        </div>
      </div>
    </main>
  );
}
