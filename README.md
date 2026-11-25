# Workshop « L’Intelligence Artificielle au Service de l’Éducation Marocaine »

Site officiel du workshop organisé par les étudiants du Master « Innovation, Technologies et IA pour l’Ingénierie Pédagogique » — ESEF Beni Mellal, Université Sultan Moulay Slimane.

**Samedi 2 janvier 2027 · 09h30 – 15h30 · ESEF Beni Mellal**

Le site propose :

- une page d’accueil bilingue (français / arabe avec affichage de droite à gauche) dans l’identité de l’affiche ;
- la **réservation de places** avec billet à QR code, liste d’attente automatique et annulation par lien ;
- le **dépôt de projets** (formulaire, PDF, validation par le comité) ;
- un **espace d’administration** : réservations, projets, statistiques, exports CSV / Excel ;
- une page de **check-in** pour scanner les billets à l’entrée avec un téléphone.

---

## Sommaire

1. [Technologies](#technologies)
2. [Installation en local](#installation-en-local)
3. [Configurer Supabase](#configurer-supabase)
4. [Configurer les e-mails (Resend)](#configurer-les-e-mails-resend)
5. [Variables d’environnement](#variables-denvironnement)
6. [Déployer sur Vercel](#déployer-sur-vercel)
7. [Modifier le contenu](#modifier-le-contenu)
8. [Utiliser l’administration](#utiliser-ladministration)
9. [Le jour J : check-in](#le-jour-j--check-in)
10. [Structure du projet](#structure-du-projet)
11. [Sécurité et données personnelles](#sécurité-et-données-personnelles)
12. [Dépannage](#dépannage)

---

## Technologies

| Rôle | Outil |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| Styles | Tailwind CSS 4, composants de style shadcn/ui (Radix) |
| Animations | Framer Motion (respecte « réduire les animations ») |
| Icônes | lucide-react |
| Langues | next-intl (`fr` par défaut, arabe sous `/ar`) |
| Base de données, fichiers, connexion admin | Supabase (Postgres, Storage, Auth) |
| E-mails | Resend |
| Formulaires | react-hook-form + Zod (validation client **et** serveur) |
| Hébergement | Vercel |

---

## Installation en local

Prérequis : **Node.js 20 ou plus récent**.

```bash
npm install
cp .env.example .env.local   # sous Windows : copy .env.example .env.local
npm run dev
```

Le site est alors disponible sur <http://localhost:3000>.

Sans configuration, la page d’accueil s’affiche déjà (150 places par défaut), mais les formulaires et l’administration ont besoin de Supabase : suivez les étapes ci-dessous.

Commandes utiles :

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Compilation de production |
| `npm run start` | Lance la version compilée |
| `npm run lint` | Vérifie le code |
| `npm run typecheck` | Vérifie les types TypeScript |

---

## Configurer Supabase

### 1. Créer le projet

1. Créez un compte sur <https://supabase.com> puis un nouveau projet (région proche du Maroc : *West EU*).
2. Dans **Project Settings → API Keys**, relevez :
   - l’URL du projet → `NEXT_PUBLIC_SUPABASE_URL`
   - la clé *publishable* (`sb_publishable_…`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - la clé *secret* (`sb_secret_…`) → `SUPABASE_SECRET_KEY`

> ⚠️ La clé secrète donne tous les droits sur la base. Elle ne doit figurer que dans `.env.local` et dans les variables d’environnement de Vercel — jamais dans le code ni dans un dépôt Git.

### 2. Créer les tables (migration SQL)

1. Ouvrez **SQL Editor → New query**.
2. Copiez-collez **tout** le contenu de [`supabase/setup.sql`](supabase/setup.sql).
3. Cliquez sur **Run**.

Ce script crée :

- les tables `reservations`, `projects`, `team_members`, `settings` (et `rate_limits` pour l’anti-spam) ;
- les fonctions de réservation, d’annulation, de promotion de la liste d’attente et de pointage ;
- la sécurité au niveau des lignes (RLS) ;
- le bucket privé `project-files` (PDF uniquement, 10 Mo maximum).

Le script peut être relancé sans risque.

### 3. Créer les comptes administrateurs

La connexion à `/admin` se fait avec **une adresse e-mail et un mot de passe**. Aucun e-mail n’est envoyé à la connexion, et il n’existe **aucune page d’inscription** : chaque compte est créé à la main dans Supabase.

Pour chaque organisateur :

1. Dans Supabase, ouvrez **Authentication → Users**.
2. Cliquez sur **Add user → Create new user**.
3. Saisissez son **adresse e-mail** et un **mot de passe** solide (12 caractères au minimum, unique, idéalement généré par un gestionnaire de mots de passe).
4. Laissez cochée la case **Auto Confirm User** : sans elle, le compte reste « en attente de confirmation » et la connexion est refusée.
5. Cliquez sur **Create user**.
6. Ajoutez la même adresse à la variable `ADMIN_EMAILS` (dans `.env.local` en local, et dans **Vercel → Settings → Environment Variables** en production), en séparant les adresses par des virgules, puis redémarrez le serveur ou redéployez.
7. Transmettez le mot de passe à la personne par un canal sûr (jamais dans un groupe WhatsApp).

Les deux conditions sont nécessaires : un compte Supabase **et** une adresse présente dans `ADMIN_EMAILS`. Un compte valide dont l’adresse n’est pas dans la liste est immédiatement déconnecté, avec un message explicite.

**Changer un mot de passe ou retirer un accès**

- Changer un mot de passe : dans **Authentication → Users**, supprimez l’utilisateur puis recréez-le avec le nouveau mot de passe (aucune donnée du workshop n’est liée au compte).
- Retirer un accès : retirez l’adresse de `ADMIN_EMAILS` (effet immédiat après redémarrage ou redéploiement) et supprimez l’utilisateur dans Supabase.

**Recommandé : fermer les inscriptions publiques**

Dans **Authentication → Sign In / Providers**, désactivez **Allow new users to sign up**. Le site ne propose pas d’inscription et `ADMIN_EMAILS` protège déjà l’administration, mais ce réglage empêche en plus toute création de compte par l’API.

**Protection contre les essais répétés** : la page de connexion accepte 5 tentatives toutes les 10 minutes par visiteur, puis affiche « Trop de tentatives ».

---

## Configurer les e-mails (Resend)

Les e-mails envoyés par le site : billet avec QR code et fichier agenda, liste d’attente, place libérée, annulation, accusé de réception d’un projet, décision du comité.

1. Créez un compte sur <https://resend.com>.
2. **Domains → Add Domain** : ajoutez votre domaine et les enregistrements DNS indiqués, puis attendez la vérification.
3. **API Keys → Create API Key** → `RESEND_API_KEY`.
4. Renseignez `EMAIL_FROM`, par exemple `Workshop IA & Éducation <workshop@votre-domaine.ma>`.

> Sans domaine vérifié, Resend n’autorise l’envoi qu’à votre propre adresse (expéditeur `onboarding@resend.dev`) : pratique pour tester, insuffisant pour l’événement.

Si `RESEND_API_KEY` ou `EMAIL_FROM` est vide, le site fonctionne normalement mais **aucun e-mail n’est envoyé** : le billet reste accessible sur la page de confirmation.

---

## Variables d’environnement

Toutes les variables sont décrites dans [`.env.example`](.env.example).

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | oui | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | oui | Clé publique Supabase |
| `SUPABASE_SECRET_KEY` | oui | Clé secrète (serveur uniquement) |
| `NEXT_PUBLIC_SITE_URL` | oui en production | Adresse publique du site, sans `/` final (liens des e-mails, image de partage) |
| `ADMIN_EMAILS` | oui | Adresses autorisées dans `/admin`, séparées par des virgules |
| `EVENT_CAPACITY` | non (150) | Nombre total de places |
| `PROJECT_SUBMISSION_DEADLINE` | non (20 décembre 2026) | Date limite de dépôt des projets, format ISO (`2026-12-20T23:59:59+01:00`) |
| `RESEND_API_KEY` | pour les e-mails | Clé Resend |
| `EMAIL_FROM` | pour les e-mails | Expéditeur des e-mails |
| `NEXT_PUBLIC_CONTACT_EMAIL` | recommandé | Adresse de contact affichée sur le site |

**Changer la capacité ou la date limite sans redéployer** : dans Supabase, **Table Editor → settings**, renseignez la colonne `value` de la ligne `capacity` (ex. `180`) ou `submission_deadline`. Une valeur vide redonne la main à la variable d’environnement. Si vous augmentez la capacité alors qu’il y a une liste d’attente, cliquez ensuite sur **Attribuer les places libres** dans l’administration.

---

## Déployer sur Vercel

1. Poussez le projet sur GitHub (le fichier `.env.local` est ignoré par Git : c’est voulu).
2. Sur <https://vercel.com> : **Add New → Project**, importez le dépôt. Vercel détecte Next.js automatiquement.
3. Dans **Environment Variables**, ajoutez toutes les variables du tableau ci-dessus.
   Pour `NEXT_PUBLIC_SITE_URL`, mettez l’adresse finale (ex. `https://workshop-ia.vercel.app`).
4. Cliquez sur **Deploy**.
5. Créez les comptes des organisateurs dans Supabase et vérifiez que `ADMIN_EMAILS` contient leurs adresses (voir [Créer les comptes administrateurs](#3-créer-les-comptes-administrateurs)).
6. Testez de bout en bout : une réservation, son annulation, un dépôt de projet, la connexion à `/admin`.

Après toute modification d’une variable sur Vercel, relancez un déploiement (**Deployments → Redeploy**).

---

## Modifier le contenu

Aucun texte n’est écrit en dur dans les composants.

| Pour modifier… | Fichier |
| --- | --- |
| Le **programme** (horaires, titres, intervenants) | [`data/programme.ts`](data/programme.ts) |
| Les **intervenants** (nom, rôle, photo) | [`data/speakers.ts`](data/speakers.ts) |
| La date, le lien Google Maps, les réseaux sociaux | [`data/site.ts`](data/site.ts) |
| Tous les textes en français | [`messages/fr.json`](messages/fr.json) |
| Tous les textes en arabe | [`messages/ar.json`](messages/ar.json) |
| Les textes des e-mails | [`lib/email/strings.ts`](lib/email/strings.ts) |
| Les listes de choix (statuts, catégories…) | [`lib/constants.ts`](lib/constants.ts) + libellés dans `messages/*.json` → `options` |
| Le logo | `public/logo-usms-esef.png` |
| Les couleurs | bloc `@theme` de [`app/globals.css`](app/globals.css) |

**Ajouter la photo d’un intervenant** : déposez l’image (carrée, 400 × 400 px environ) dans `public/speakers/`, puis ajoutez `photo: "/speakers/nom-du-fichier.jpg"` à la personne dans `data/speakers.ts`. Sans photo, un avatar avec ses initiales est affiché.

**Ajouter une séance au programme** : ajoutez un bloc dans `data/programme.ts`. L’heure de fin est calculée automatiquement (début de la séance suivante).

---

## Utiliser l’administration

Adresse : `/admin` (lien discret « Espace organisateurs » en bas du site).

**Connexion** : saisissez votre adresse e-mail et votre mot de passe (la page existe en français et en arabe). Le bouton **Se déconnecter** se trouve en haut à droite de chaque page de l’administration.

| Onglet | Ce qu’on y fait |
| --- | --- |
| **Réservations** | Rechercher, filtrer par statut ou présence, marquer présent, annuler une réservation, consulter la liste d’attente, exporter en CSV ou Excel |
| **Projets** | Lire chaque proposition, ouvrir le PDF, accepter ou refuser avec un commentaire facultatif (le porteur reçoit un e-mail) |
| **Statistiques** | Nombre de réservations, taux de remplissage, répartition par statut, par établissement et par canal, état des projets |
| **Check-in** | Scanner les billets le jour J |

Seuls les projets **acceptés** apparaissent dans la section « Projets » du site (mise à jour en une minute au plus).

---

## Le jour J : check-in

1. Sur un téléphone, ouvrez `/admin/check-in` et connectez-vous (faites-le la veille pour vérifier que tout fonctionne).
2. Appuyez sur **Activer la caméra** et autorisez l’accès.
3. Présentez le QR code du billet : la présence est enregistrée immédiatement.

| Affichage | Signification |
| --- | --- |
| 🟢 Présence enregistrée | Tout est bon |
| 🟠 Déjà pointé | Le billet a déjà été scanné (l’heure est affichée) |
| 🟠 Sur liste d’attente | Pas de place confirmée |
| 🔴 Réservation annulée / Billet inconnu | Billet non valable |

Si un QR code est illisible, saisissez le code du billet (`IAE-XXXXXX`) dans le champ prévu, ou cherchez la personne dans l’onglet **Réservations** et cliquez sur **Marquer présent**.

Plusieurs organisateurs peuvent scanner en même temps sur plusieurs téléphones. La caméra exige une connexion **HTTPS** (c’est le cas sur Vercel).

---

## Structure du projet

```
app/
  [locale]/                 Site public (fr et ar)
    page.tsx                Page d’accueil
    reservation/            Formulaire, billet/[token], annuler/[token]
    projets/soumettre/      Dépôt d’un projet
    opengraph-image.tsx     Image de partage (WhatsApp, Facebook…)
  admin/                    Administration (français uniquement)
    login/                  Connexion par e-mail et mot de passe
    (dashboard)/            Réservations, projets, statistiques, check-in
    export/reservations/    Export CSV / Excel
    actions.ts              Actions serveur de l’administration
  actions/                  Actions serveur publiques (réservation, projet)
  api/                      Compteur de places, fichier agenda (.ics)
components/
  landing/                  Sections de la page d’accueil
  forms/                    Formulaires
  admin/                    Tableaux, tableau des projets, scanner
  ticket/                   Billet à QR code
  shared/                   Éléments communs (logo, décor, en-têtes)
  ui/                       Composants de base (bouton, champs, accordéon)
data/                       Programme, intervenants, infos de l’événement
messages/                   Traductions fr.json et ar.json
lib/                        Validation, e-mails, sécurité, accès aux données
supabase/migrations/        Script SQL de la base
utils/supabase/             Clients Supabase (navigateur, serveur, admin)
proxy.ts                    Routage des langues + session admin
```

---

## Sécurité et données personnelles

- **Places sans surréservation** : le comptage et l’inscription se font dans une seule fonction Postgres (`reserve_seat`) protégée par un verrou. Deux personnes ne peuvent pas obtenir la même dernière place.
- **Une réservation par e-mail** : contrainte d’unicité en base (insensible à la casse). Une réservation annulée libère l’adresse.
- **Accès aux données** : la RLS est activée sur toutes les tables et aucun accès direct n’est ouvert au public. Les formulaires passent par le serveur, qui applique la validation, le champ piège anti-robots et la limitation de débit. Seuls les administrateurs de `ADMIN_EMAILS` peuvent lire les données.
- **PDF des projets** : stockés dans un bucket privé ; ils ne sont consultables que par un administrateur, via un lien temporaire de 5 minutes.
- **Liens personnels** : le billet et le lien d’annulation reposent sur des jetons aléatoires impossibles à deviner. L’annulation demande toujours un clic de confirmation.
- **Données collectées** : uniquement celles nécessaires à l’événement (billet, pointage, attestation), avec le consentement explicite du participant. Pensez à supprimer les données une fois les attestations délivrées (Supabase → Table Editor), et à vérifier vos obligations au regard de la loi 09-08 (CNDP).

---

## Dépannage

| Problème | Solution |
| --- | --- |
| « Le service n’est pas encore configuré » à l’envoi d’un formulaire | `SUPABASE_SECRET_KEY` est vide. Renseignez-la et redémarrez le serveur |
| « Les tables sont introuvables » dans l’administration | La migration SQL n’a pas été exécutée (voir [Configurer Supabase](#configurer-supabase)) |
| « Configuration incomplète » sur `/admin/login` | `SUPABASE_SECRET_KEY` ou `ADMIN_EMAILS` est vide |
| « E-mail ou mot de passe incorrect » alors que les identifiants sont bons | Le compte n’existe pas dans **Authentication → Users**, ou il a été créé sans **Auto Confirm User** : supprimez-le et recréez-le |
| « Ce compte n’est pas autorisé » | L’adresse n’est pas dans `ADMIN_EMAILS` (vérifiez l’orthographe, puis redémarrez ou redéployez) |
| « Trop de tentatives » à la connexion | Attendez 10 minutes : la limite est de 5 essais par visiteur |
| Les participants ne reçoivent pas d’e-mail | `RESEND_API_KEY` / `EMAIL_FROM` manquants, ou domaine non vérifié dans Resend (consultez **Resend → Logs**) |
| Les liens des e-mails pointent vers `localhost` | `NEXT_PUBLIC_SITE_URL` n’est pas défini sur Vercel |
| La caméra ne s’ouvre pas au check-in | Autorisez la caméra pour le site dans le navigateur ; la page doit être en HTTPS |
| Le compteur affiche toujours 150 places | La base est injoignable ou la migration n’a pas été exécutée : la valeur par défaut est affichée |

---

Ensemble pour une éducation augmentée.
