# Projet `airtable_syndicat`

## 1) Objet

Application web Next.js (App Router) pour consulter des informations cadastrales et propriétaires liées a la foret usagere, avec donnees source dans Airtable.

Objectifs principaux :
- Rechercher rapidement une section cadastrale.
- Afficher les informations de contact utiles.
- Naviguer par parcelle mere.
- Restreindre l'acces via lien magique + session temporaire.

## 2) Etat fonctionnel actuel

### Fonctionnalites utilisateur
- Page d'accueil avec hero visuel + recherche client instantanee dans les cadastres.
- Liste des resultats avec :
  - code section/numero/part,
  - surface,
  - parcelle mere (lieu-dit),
  - proprietaire principal.
- Fiche detail d'un cadastre :
  - proprietaire principal,
  - contact principal (nom/adresse),
  - actions tel/mail,
  - notes et infos contextuelles.
- Navigation par parcelles meres :
  - liste des parcelles,
  - detail d'une parcelle et ses sections.
- Ecran d'acces prive (`/acces`) pour les cas session manquante/invalide.

### Authentification / controle d'acces
- Entree via lien magique : `/auth/magic?token=...`
- Verification token dans la table Airtable `Users`.
- Creation d'un cookie de session HTTP-only (`fu_session`) valable 5h.
- Middleware global :
  - protege toute l'application,
  - autorise seulement `/auth/magic` et `/acces` sans session.

## 3) Architecture technique

### Stack
- Next.js `16.1.6`
- React `19.2.3`
- TypeScript
- Tailwind CSS v4
- Airtable via API HTTP (`fetch`), pas via SDK runtime.

### Organisation du code
- `webapp/src/app/` : routes App Router (pages + API routes)
- `webapp/src/components/` : composants client (ex: panel de recherche)
- `webapp/src/lib/airtable.ts` : acces donnees Airtable + mapping/metier
- `webapp/src/lib/session.ts` : signature/verif de session (HMAC SHA-256)
- `webapp/middleware.ts` : garde d'acces

### Choix techniques notables
- `dynamic = "force-dynamic"` sur pages de consultation pour eviter cache stale.
- Validation stricte des IDs Airtable (`rec...`) avant requetes.
- Recherche serveur via `filterByFormula` pour limiter transferts inutiles.
- Resolution de liens Airtable (cadastre -> proprietaire -> personne) pour enrichir la recherche et la fiche detail.

## 4) Donnees Airtable utilisees

Tables referencees :
- `🗺 Parcelles Mères`
- `📝 Cadastre`
- `🌳 Propriétaires`
- `👨‍👩‍👧‍👦 Personnes`
- `👷🏻‍♂️ Users`

Exemples de champs exploites :
- Cadastre : `Section`, `Num`, `Part`, `Surface`, `Notes`, `Nom Propriétaire`, `Personnes`, `Ville`, `e-mail`, `téléphone`, `téléphone 2`
- Proprietaires : `Nom Propriétaire`, `Mandataire`, `Personnes`, coordonnees
- Personnes : nom/prenom/raison sociale + coordonnees
- Users : `MagicLink`, `Status`, `e-mail`, `Nom`

## 5) Variables d'environnement

Obligatoires :
- `AIRTABLE_API_TOKEN`
- `AIRTABLE_BASE_ID`
- `APP_SESSION_SECRET`

Sans ces variables :
- les requetes Airtable echouent,
- la session ne peut pas etre signee/verifiee.

## 6) Routes principales

Pages :
- `/` : accueil + recherche
- `/parcelles-meres`
- `/parcelles-meres/[id]`
- `/cadastres/[id]`
- `/recherche`
- `/acces`

Routes API :
- `/api/test-airtable` (desactivee en production : retourne 404)
- `/auth/magic`

## 7) Chronologie projet (reconstituee)

Historique base sur les commits Git du `2026-02-26` au `2026-02-27` :

1. `8260baa` Initial commit
2. `3a8a134` Scaffold Next.js
3. `4683e5d` Smoke test Airtable
4. `5e69167` Deplacement route test vers App Router API
5. `a546db1` -> `8a2e93d` Stabilisation test Airtable (erreurs, fetch HTTP, robustesse env)
6. `2c3f981` MVP 000 (pages principales + couche Airtable)
7. `f92b492` Optimisations (securisation endpoint test + validation/recherche cote Airtable)
8. `c7e3450` MVP 001 (home recherche client + navigation parcelles)
9. `d137b8c` MVP 002 (hero visuel + enrichissements recherche)
10. `3c2b8d7` MVP 003 (detail cadastre enrichi contacts)
11. `04d141b` MVP 004 (acces prive, magic link, middleware, session)
12. `4361263` MVP 005 (ajustements UI home/panel)
13. `ce58a00` MVP 006 (finalisation UI home/panel)

## 8) Hébergement et domaine

- **Plateforme** : Vercel (free tier), projet `airtable-syndicat`
- **Repo** : `foret-usagere-libre/airtable_syndicat` (GitHub, public)
- **URL prod** : `https://cadastre.foret-usagere.fr`
- **Déploiement** : automatique à chaque push sur `main`
- **Root directory Vercel** : `webapp/`
- **Variables d'env** : saisies dans le dashboard Vercel (jamais dans le repo)

Le domaine `cadastre.foret-usagere.fr` pointe via CNAME Vercel, configuré dans OVH.

## 9) Gestion des utilisateurs

Les utilisateurs sont gérés directement dans Airtable, table `👷🏻‍♂️ Users`.

Champs requis :
- `Nom` : nom de l'utilisateur
- `e-mail` : email
- `MagicLink` : token unique (chaîne arbitraire, ex. UUID)
- `Status` : statut actif

Pour donner accès à un utilisateur :
1. Créer un enregistrement dans la table `Users`
2. Renseigner un token unique dans `MagicLink`
3. Envoyer le lien : `https://cadastre.foret-usagere.fr/auth/magic?token=<valeur MagicLink>`

La session créée est valable 5h. Le lien peut être réutilisé (pas de consommation unique).

## 10) Commandes developpement

Depuis `webapp/` :
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## 11) Limites et points d'attention

- Le composant de recherche client charge une liste Airtable au rendu serveur ; si volumetrie tres grande, prevoir pagination/indexation dediee.
- La route `/api/test-airtable` est utile en dev uniquement.
- Le magic link n'est pas à usage unique : si l'URL est interceptée, elle reste valide. Acceptable pour cet usage.

## Scénario de vibe coding pour les nuls

Pour ce projet, j’ai installé l’application Codex qui prend sur l’appli de mon compte ChatGPT, j’ai créé des répertoire de travail dans mon arborescence obsidian. Par ailleurs j’ai installé l’application Git qui donne accès à mon compte Guithub qui permet de faire commis depuis le code le répertoire, puis de fou, le répertoire en ligne
J’utilise aussi.
