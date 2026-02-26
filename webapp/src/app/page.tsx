import Link from "next/link";
import Image from "next/image";
import CadastreSearchPanel from "@/components/cadastre-search-panel";
import { listCadastresForHome } from "@/lib/airtable";
import hero from "./hero.jpeg";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cadastres = await listCadastresForHome();

  return (
    <main className="min-h-screen bg-[#e8ecf1]">
      <div className="relative h-[42vh] min-h-[280px] max-h-[420px] w-full overflow-hidden">
        <Image src={hero} alt="Forêt usagère" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/55" />
      </div>
      <div className="mx-auto -mt-16 max-w-5xl px-3 pb-8 sm:px-4">
        <CadastreSearchPanel initialItems={cadastres} />
        <div className="mt-5 text-center">
          <Link
            href="/parcelles-meres"
            className="inline-block rounded-xl border border-slate-300/80 bg-white/90 px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm"
          >
            Voir la navigation par parcelles mères
          </Link>
        </div>
      </div>
    </main>
  );
}
