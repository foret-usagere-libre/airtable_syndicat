# Log cadastre

Ce journal conserve uniquement les étapes abouties avec succès dans ce thread.

## 2026-02-26

- 15:37 CET — Consigne validée : démarrage du journal `log_cadastre.md` dans le répertoire `airtable_syndicat`.
- 15:42 CET — Contexte validé : les étapes à consigner proviennent du thread `@j'ai une base… !`.
- 23:23 CET — Reconstitution aboutie de l’évolution du projet (fonctionnel + technique) à partir de l’historique Git et de l’état courant du repo.
  - Historique Git confirmé (10 commits datés du 26/02/2026).
  - Base technique initiale : dépôt minimal puis scaffold Next.js App Router (`webapp/`).
  - Étape connexion Airtable : ajout d’un endpoint de smoke test, puis déplacement en route API (`/api/test-airtable`).
  - Stabilisation du test Airtable : migration SDK Airtable -> `fetch` HTTP direct, enrichissement des erreurs, puis durcissement (trim env vars, blocage en production).
  - MVP fonctionnel : navigation par parcelles mères, pages de détail parcelle/cadastre, recherche globale, couche d’accès Airtable centralisée (`src/lib/airtable.ts`).
  - Optimisations backend Airtable : validation des record IDs, recherche serveur via `filterByFormula`, limitation des champs récupérés (réduction payload).
  - État local non commité identifié : refonte de la home en moteur de recherche client (`cadastre-search-panel`) alimenté par `listCadastresForHome()`.
  - Limite explicite : aucune archive de chat dédiée trouvée dans le repo; reconstitution fondée sur traces Git + fichiers présents.
- 00:56 CET — Documentation projet créée (`DOC_PROJET.md`) avec synthèse fonctionnelle, architecture technique, auth/session, routes, variables d’environnement et chronologie MVP 000 -> MVP 006 (26/02/2026 -> 27/02/2026).
