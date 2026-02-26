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
    <main className="mx-auto min-h-screen max-w-xl bg-slate-50 p-4">
      <Link href="/" className="mb-4 inline-block text-sm text-slate-700 underline">
        ← Retour à l&apos;accueil
      </Link>

      <h1 className="text-2xl font-semibold">
        Section {cadastre.section || "?"} {cadastre.numero || ""}
      </h1>
      {cadastre.part ? <p className="text-sm text-slate-600">Partie: {cadastre.part}</p> : null}
      <p className="mb-4 text-sm text-slate-600">
        {cadastre.surface ? `${cadastre.surface} m²` : "Surface inconnue"}
      </p>

      {cadastre.proprietaires.length > 0 ? (
        <section className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
          <h2 className="mb-2 font-medium">Propriétaires</h2>
          <ul className="space-y-1 text-sm text-slate-700">
            {cadastre.proprietaires.map((owner) => (
              <li key={owner}>• {owner}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {cadastre.personnes.length > 0 ? (
        <section className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
          <h2 className="mb-2 font-medium">Personnes liées</h2>
          <ul className="space-y-1 text-sm text-slate-700">
            {cadastre.personnes.map((person) => (
              <li key={person}>• {person}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
        <h2 className="mb-2 font-medium">Contacts</h2>
        <div className="flex flex-wrap gap-2">
          {cadastre.telephones.map((phone) => (
            <a
              key={phone}
              href={`tel:${normalizePhone(phone)}`}
              className="rounded bg-green-700 px-3 py-1 text-sm font-medium text-white"
            >
              📞 {phone}
            </a>
          ))}
          {cadastre.emails.map((email) => (
            <a
              key={email}
              href={`mailto:${email}`}
              className="rounded bg-blue-700 px-3 py-1 text-sm font-medium text-white"
            >
              ✉️ {email}
            </a>
          ))}
          {cadastre.telephones.length === 0 && cadastre.emails.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun contact disponible.</p>
          ) : null}
        </div>
      </section>

      {cadastre.villes.length > 0 ? (
        <section className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
          <h2 className="mb-2 font-medium">Villes</h2>
          <p className="text-sm text-slate-700">{cadastre.villes.join(", ")}</p>
        </section>
      ) : null}

      {cadastre.notes ? (
        <section className="rounded-lg border border-slate-200 bg-white p-3">
          <h2 className="mb-2 font-medium">Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{cadastre.notes}</p>
        </section>
      ) : null}
    </main>
  );
}
