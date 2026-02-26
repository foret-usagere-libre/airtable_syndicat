import Link from "next/link";

type AccessPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function AccesPage({ searchParams }: AccessPageProps) {
  const { reason } = await searchParams;
  const isMissingToken = reason === "missing-token";

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-slate-50 p-6">
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold">Accès privé</h1>
        <p className="mt-3 text-sm text-slate-700">
          {isMissingToken
            ? "Lien invalide. Vérifiez que vous avez ouvert l’URL complète."
            : "Accès refusé ou session expirée. Utilisez votre lien magique nominatif."}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Le lien donne un accès temporaire de 5 heures maximum.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          Retour
        </Link>
      </section>
    </main>
  );
}
