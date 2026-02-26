import Link from "next/link";
import { getCadastreById } from "@/lib/airtable";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export default async function CadastrePage({ params }: PageProps) {
  const { id } = await params;
  const cadastre = await getCadastreById(id);

  if (!cadastre) {
    return (
      <main className="mx-auto min-h-screen max-w-xl bg-slate-50 p-4">
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Section cadastrale introuvable.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Link href="/" className="mb-4 inline-block text-sm text-slate-700 underline">
          ← Retour accueil
        </Link>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-semibold">
            {cadastre.proprietaires[0] || "Propriétaire non renseigné"}
          </h1>

          {cadastre.contactNoms.length > 0 ? (
            <p className="mt-3 text-sm text-slate-700">{cadastre.contactNoms.join(", ")}</p>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {cadastre.telephones.map((phone) => (
              <a
                key={phone}
                href={`tel:${normalizePhone(phone)}`}
                className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white"
              >
                Appeler {phone}
              </a>
            ))}
            {cadastre.emails.map((email) => (
              <a
                key={email}
                href={`mailto:${email}`}
                className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white"
              >
                Email {email}
              </a>
            ))}
          </div>

          {cadastre.telephones.length === 0 && cadastre.emails.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Aucun contact disponible.</p>
          ) : null}

          <p className="mt-5 border-t border-slate-200 pt-3 text-sm text-slate-600">
            Si e-mail ou téléphone n&apos;apparaît pas, il n&apos;est pas encore renseigné.
          </p>
        </section>

        {cadastre.contactAdresse ? (
          <section className="mt-4 rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-1 font-medium">Adresse postale du contact</h2>
            <p className="text-sm text-slate-700">{cadastre.contactAdresse}</p>
          </section>
        ) : null}

        {cadastre.parcelleMere ? (
          <section className="mt-4 rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-1 font-medium">Parcelle mère</h2>
            <p className="text-sm text-slate-700">{cadastre.parcelleMere}</p>
          </section>
        ) : null}

        {cadastre.villes.length > 0 ? (
          <section className="mt-4 rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-1 font-medium">Villes</h2>
            <p className="text-sm text-slate-700">{cadastre.villes.join(", ")}</p>
          </section>
        ) : null}

        {cadastre.notes ? (
          <section className="mt-4 rounded-xl bg-white p-4 shadow-sm">
            <h2 className="mb-1 font-medium">Notes</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{cadastre.notes}</p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
