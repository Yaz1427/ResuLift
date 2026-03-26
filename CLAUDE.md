# CLAUDE.md — ResuLift

## Projet

ResuLift est un micro-SaaS qui analyse les CV contre des descriptions de poste (job descriptions), donne un score de compatibilité ATS (0-100) avec des recommandations concrètes, et génère un CV optimisé ATS téléchargeable en .docx (Premium). Business model pay-per-analysis : Basic à $5, Premium à $12. Analyse gratuite unique offerte à chaque nouveau compte.

- **URL de production** : https://resulift.cv (redirige vers www.resulift.cv)
- **Repo** : https://github.com/Yaz1427/ResuLift
- **Hébergement** : Vercel (projet `resu-lift-jsc2`)
- **Base de données** : Supabase (projet `rrplwoztvfjnotgrswbb`, région eu-west-3 Paris)
- **Domaine** : resulift.cv (Porkbun, DNS via Cloudflare)
- **Emails** : Resend (domaine vérifié resulift.cv)

---

## Stack technique

| Couche | Technologie | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.1 |
| Langage | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS | v4 |
| UI Components | shadcn/ui (base-ui) | 4.x |
| Base de données | Supabase (PostgreSQL) | - |
| Auth | Supabase Auth (@supabase/ssr) | 0.9.x |
| Paiements | Stripe (Checkout Sessions + Webhooks) | 20.x |
| IA / Analyse | Anthropic Claude API (claude-sonnet-4-20250514) | - |
| Parsing CV | pdf-parse@1.1.1 (PDF) + mammoth (DOCX) | - |
| Génération CV | docx (librairie npm) | 9.6.x |
| Génération PDF | pdf-lib + jsPDF + html2canvas | - |
| Emails | Resend | 6.x |
| Validation | Zod | v4 |
| State | Zustand | 5.x |
| Animations | Framer Motion | 12.x |
| Analytics | @vercel/analytics | 2.x |
| Rate limiting | Upstash (Redis + ratelimit) — optionnel | - |
| Deploy | Vercel (auto-deploy sur push main) | - |

⚠️ **pdf-parse DOIT rester en v1.1.1** — la v2 nécessite @napi-rs/canvas qui crashe sur Vercel serverless (DOMMatrix is not defined).

---

## Architecture & Structure des fichiers

```
resulift/
├── middleware.ts                         # Auth middleware — protège /dashboard/*, exception /api/*
├── src/
│   ├── app/
│   │   ├── (auth)/                      # Routes publiques auth
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (marketing)/                 # Pages publiques
│   │   │   ├── page.tsx                 # Landing page (/) avec hero, stats, 3 steps, features, pricing, avant/après, FAQ, CTA
│   │   │   ├── pricing/page.tsx
│   │   │   └── layout.tsx
│   │   ├── auth/
│   │   │   └── callback/route.ts        # OAuth callback
│   │   ├── dashboard/                   # Routes protégées (auth required)
│   │   │   ├── page.tsx                 # Vue d'ensemble + stats + tableau analyses avec pagination/filtres
│   │   │   ├── loading.tsx              # Loading skeleton du dashboard
│   │   │   ├── new/page.tsx             # Stepper 3 étapes (upload CV → JD + pays/séniorité → choix plan + essai gratuit)
│   │   │   ├── analysis/[id]/page.tsx   # Résultat d'analyse (score, catégories, recommandations, CV optimisé)
│   │   │   ├── settings/page.tsx        # Paramètres compte + langue + avatar upload
│   │   │   └── layout.tsx               # Sidebar + mobile header + dashboard footer
│   │   ├── api/
│   │   │   ├── analysis/                # Polling status + retry + free analysis
│   │   │   ├── auth/                    # Auth helpers
│   │   │   ├── checkout/route.ts        # Crée Stripe Checkout Session
│   │   │   ├── generate-cv/route.ts     # Génère le CV optimisé .docx (Premium)
│   │   │   ├── resume-preview/route.ts  # Preview du CV avant/après
│   │   │   ├── upload/route.ts          # Upload CV vers Supabase Storage
│   │   │   └── webhooks/stripe/route.ts # Webhook Stripe (déclenche l'analyse)
│   │   ├── share/[shareId]/page.tsx     # Page publique de partage de résultat
│   │   ├── privacy/page.tsx             # Politique de confidentialité
│   │   ├── terms/page.tsx               # CGU
│   │   ├── layout.tsx                   # Root layout (Analytics, LanguageProvider, Toaster, NavigationProgress)
│   │   ├── error.tsx                    # Error boundary
│   │   ├── not-found.tsx                # 404
│   │   ├── robots.ts                    # SEO
│   │   ├── sitemap.ts                   # SEO
│   │   └── globals.css                  # CSS global + variables de thème
│   ├── components/
│   │   ├── ui/                          # Composants shadcn/base-ui
│   │   ├── analysis/                    # Composants spécifiques analyse
│   │   │   ├── analysis-polling.tsx     # Polling du status avec spinner + timeout
│   │   │   ├── analysis-result-view.tsx # Vue complète du résultat (tabs: catégories, recommandations, bullets, keywords)
│   │   │   ├── score-gauge.tsx          # Gauge circulaire SVG animée (arc minimum 4%)
│   │   │   ├── category-card.tsx        # Carte par catégorie avec score + tags présent/manquant
│   │   │   ├── recommendations-list.tsx # Liste des recommandations priorisées
│   │   │   ├── optimized-bullets.tsx    # [PREMIUM] Before/after des bullet points
│   │   │   ├── resume-uploader.tsx      # Drag & drop upload (react-dropzone)
│   │   │   ├── download-cv-button.tsx   # [PREMIUM] Téléchargement du CV optimisé .docx
│   │   │   ├── cv-preview-button.tsx    # [PREMIUM] Preview du CV avant téléchargement
│   │   │   ├── resume-preview-button.tsx# Preview du CV original uploadé
│   │   │   ├── share-button.tsx         # Copie du lien de partage public
│   │   │   ├── delete-button.tsx        # Suppression avec confirmation dialog
│   │   │   └── retry-button.tsx         # Retry d'analyse échouée (sans repayer)
│   │   ├── marketing/
│   │   │   └── pricing-view.tsx         # Composant pricing réutilisable (landing + page dédiée)
│   │   └── shared/
│   │       ├── navbar.tsx               # Navbar marketing (logo, liens, auth, language switcher)
│   │       ├── footer.tsx               # Footer marketing
│   │       ├── dashboard-sidebar.tsx    # Sidebar dashboard (desktop)
│   │       ├── dashboard-footer.tsx     # Footer dashboard
│   │       ├── mobile-header.tsx        # Header mobile hamburger (dashboard)
│   │       ├── language-provider.tsx    # Context provider i18n
│   │       ├── language-switcher.tsx    # Sélecteur de langue (FR/EN/AR)
│   │       ├── navigation-progress.tsx  # Barre de progression de navigation
│   │       └── loading.tsx              # Spinner de chargement
│   ├── lib/
│   │   ├── analysis-engine.ts           # Moteur d'analyse — appelle Claude API avec retry
│   │   ├── prompts.ts                   # Prompts IA (basic, premium, CV optimization)
│   │   ├── cv-generator.ts              # Génère le .docx optimisé ATS (librairie docx)
│   │   ├── resume-parser.ts             # Parse PDF (pdf-parse@1.1.1) + DOCX (mammoth) → texte brut
│   │   ├── pdf-generator.ts             # Génère le rapport PDF (pdf-lib)
│   │   ├── stripe.ts                    # Client Stripe
│   │   ├── email.ts                     # Service d'envoi email (Resend)
│   │   ├── emails/                      # Templates email (welcome, analysis-complete, receipt)
│   │   ├── i18n.ts                      # Système i18n (FR, EN, العربية) — ~23K chars de traductions
│   │   ├── lang-detect.ts              # Détection de langue du CV
│   │   ├── supabase/
│   │   │   ├── client.ts               # Client browser (createBrowserClient)
│   │   │   ├── server.ts               # Client serveur (createServerClient)
│   │   │   └── middleware.ts           # Client middleware
│   │   ├── validations.ts              # Schemas Zod
│   │   ├── button-variants.ts          # CVA variants pour les boutons
│   │   └── utils.ts                    # Helpers (cn, formatDate, etc.)
│   ├── hooks/
│   │   └── use-analysis.ts             # Hook custom pour les analyses
│   └── types/
│       ├── analysis.ts                 # Types AnalysisResult, CategoryResult, OptimizedBullet, etc.
│       ├── database.ts                 # Types Supabase (Profile, Analysis, Payment)
│       └── index.ts                    # Re-exports
├── supabase/
│   └── schema.sql                      # Schema complet (3 tables + RLS + triggers + storage bucket)
└── public/
    └── og-image.png                    # Open Graph image (1200x630)
```

---

## Base de données (Supabase)

### Tables

**`profiles`** — Extension de auth.users
- `id` (uuid, PK, FK → auth.users)
- `email` (text, not null)
- `full_name` (text, nullable)
- `credits` (integer, default 0)
- `plan` (text, default 'free', check: free/basic/premium)
- `stripe_customer_id` (text, unique, nullable)
- `free_analysis_used` (boolean, default false) — track si l'essai gratuit a été utilisé
- `avatar_url` (text, nullable) — URL de la photo de profil dans Supabase Storage
- `created_at`, `updated_at` (timestamptz)
- Trigger auto-création du profil à l'inscription

**`analyses`** — Résultats des analyses
- `id` (uuid, PK, default gen_random_uuid())
- `user_id` (uuid, FK → profiles, not null)
- `type` (text, check: basic/premium)
- `status` (text, default 'pending', check: pending/processing/completed/failed)
- `resume_url` (text, not null) — URL dans Supabase Storage
- `resume_filename` (text, not null)
- `job_title`, `job_company` (text, nullable)
- `job_description` (text, not null)
- `target_country` (text, nullable) — pays ciblé pour l'analyse
- `seniority_level` (text, nullable) — niveau d'expérience
- `ats_score` (integer, check 0-100, nullable)
- `result` (JSONB, nullable) — résultat complet de l'analyse structuré
- `optimized_cv_url` (text, nullable) — URL du CV .docx généré
- `share_id` (uuid, unique, default gen_random_uuid()) — pour le lien de partage public
- `created_at` (timestamptz), `completed_at` (timestamptz, nullable)

**`payments`** — Historique des paiements
- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `analysis_id` (uuid, FK → analyses, nullable)
- `stripe_session_id` (text, unique, not null)
- `stripe_payment_intent_id` (text, nullable)
- `amount` (integer, not null) — en centimes
- `currency` (text, default 'usd')
- `status` (text, default 'pending', check: pending/succeeded/failed/refunded)
- `created_at` (timestamptz)

### Storage Buckets
- **`resumes`** (privé) — CV uploadés par les utilisateurs
- **`avatars`** (public) — Photos de profil. Policies: SELECT public, INSERT/UPDATE/DELETE owner only (`auth.uid()::text = (storage.foldername(name))[1]`)

### Row Level Security (RLS)
- Activé sur toutes les tables
- Chaque user ne voit/modifie que SES propres données
- Le service_role bypass RLS pour les webhooks Stripe

---

## Flux principaux

### Flow d'analyse (cœur du produit)
1. User upload CV (PDF/DOCX, max 5MB) → `POST /api/upload` → Supabase Storage bucket `resumes`
2. User colle la job description + optionnel: job title, company, pays ciblé, niveau de séniorité
3. User choisit : Essai gratuit (si disponible) OU Basic $5 OU Premium $12
4. Si payant : `POST /api/checkout` → Stripe Checkout Session → redirect → paiement
5. Webhook `checkout.session.completed` → `POST /api/webhooks/stripe` (sur www.resulift.cv)
6. Le webhook déclenche l'analyse : parse CV (pdf-parse/mammoth) → appel Claude API → sauvegarde résultat dans `analyses.result` (JSONB)
7. Frontend poll `GET /api/analysis/[id]/status` toutes les 3s jusqu'à `completed` ou `failed`
8. Affichage du résultat : score gauge, 5 catégories, recommandations, keywords
9. **[PREMIUM]** : bullet points before/after + bouton "Télécharger CV optimisé (.docx)"

### Flow essai gratuit
1. Si `profiles.free_analysis_used === false` → bouton "Essai gratuit" visible à l'étape 3
2. Clique → crée l'analyse directement (skip Stripe) → lance l'analyse IA
3. Marque `free_analysis_used = true` dans le profil
4. Analyse basique uniquement (pas de premium en gratuit)

### Flow CV optimisé (Premium)
1. Après une analyse Premium complétée → bouton "Télécharger mon CV optimisé"
2. `POST /api/generate-cv` → appel Claude API avec prompt de réécriture → génère .docx avec librairie `docx`
3. Format ATS-friendly : pas de tableaux/colonnes/images, Calibri 11pt, sections en MAJUSCULES
4. Inclut la photo de profil (avatar) si uploadée dans les paramètres
5. Téléchargement direct du fichier .docx

### Flow d'authentification
- Supabase Auth : email/password (Google OAuth préparé mais pas activé)
- Middleware Next.js protège `/dashboard/*`, exception pour `/api/*` (webhooks)
- Refresh automatique du token via `@supabase/ssr`

### Flow de paiement
- Pay-per-analysis (pas d'abonnement)
- Stripe Checkout Sessions (pas de formulaire de carte custom)
- Webhook vérifie la signature Stripe avant de lancer l'analyse
- Jamais d'analyse payante sans confirmation du paiement
- Retry sans repayer si l'analyse a échoué (vérifie le paiement original)

### Flow de partage
- Chaque analyse a un `share_id` unique auto-généré
- Bouton "Partager" copie le lien `/share/[shareId]`
- Page publique affiche le score + breakdown (sans recommandations détaillées)

---

## Moteur d'analyse IA

### Modèle : claude-sonnet-4-20250514

### Prompts (src/lib/prompts.ts)
Trois prompts distincts :
1. **Analyse basique** : scoring 5 catégories, keywords, recommandations → JSON structuré
2. **Analyse premium** : idem + réécriture de chaque bullet point + suggestions keywords → JSON structuré
3. **Réécriture CV** : prend le CV original + résultat d'analyse → génère un CV complet restructuré → JSON structuré

### Scoring (5 catégories, pondération fixe)
- Keywords Match — 30%
- Skills Alignment — 25%
- Experience Relevance — 20%
- Format & Structure — 15%
- Impact Statements — 10%

### Contexte additionnel dans les prompts
- `target_country` : adapte les conventions CV au pays ciblé
- `seniority_level` : adapte les attentes selon le niveau (junior/mid/senior)

### Output
- JSON strictement structuré (schema dans le prompt)
- Validé côté serveur avant sauvegarde
- Stocké dans `analyses.result` (JSONB)

---

## Stripe

- **Mode** : Test (clés `sk_test_` / `pk_test_`)
- **Produit Basic** : `prod_UCEl5yF2vC6JyE` → Prix : `price_1TDqI3E2AJVBZrpRQGHGI4fy` ($5)
- **Produit Premium** : `prod_UCEl058NxZ3UYK` → Prix : `price_1TDqIBE2AJVBZrpRSFyn7qXZ` ($12)
- **Webhook URL** : `https://www.resulift.cv/api/webhooks/stripe` (⚠️ doit être sur www, pas resulift.cv car redirection 307)
- **Events écoutés** : `checkout.session.completed`, `checkout.session.expired`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- **Carte de test** : `4242 4242 4242 4242` (n'importe quelle date future, n'importe quel CVC)

---

## i18n

Système i18n custom dans `src/lib/i18n.ts` (~23K chars). Trois langues supportées :
- 🇫🇷 Français (par défaut)
- 🇬🇧 English
- 🇩🇿 العربية (Arabe)

Provider : `src/components/shared/language-provider.tsx` (React Context)
Switcher : `src/components/shared/language-switcher.tsx`
Le choix est stocké en localStorage et persiste entre les sessions.
Tout nouveau texte visible doit passer par `i18n.ts`.

---

## Emails (Resend)

Domaine vérifié : `resulift.cv` (DNS DKIM + SPF + DMARC configurés sur Porkbun)
Templates dans `src/lib/emails/` :
- Welcome — après inscription
- Analysis Complete — quand l'analyse est terminée (inclut le score)
- Receipt — reçu de paiement

Service : `src/lib/email.ts`

---

## Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_BASIC_PRICE_ID=
STRIPE_PREMIUM_PRICE_ID=

# Anthropic
ANTHROPIC_API_KEY=

# Resend
RESEND_API_KEY=

# Upstash (optionnel)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000  # ou https://resulift.cv en prod
```

⚠️ Le `.env.local` n'est JAMAIS commité. Il est dans `.gitignore`.
Les variables de prod sont dans Vercel → Settings → Environment Variables.

---

## Commandes

```bash
npm run dev      # Dev server sur localhost:3000
npm run build    # Build production
npm run start    # Start production server
npm run lint     # ESLint
```

---

## Conventions de code

### TypeScript
- **Strict mode** activé — zéro `any`
- Tous les types dans `src/types/`
- Validation des inputs API avec Zod (`src/lib/validations.ts`)

### Composants React
- **Server Components par défaut** — Client Components uniquement pour l'interactivité
- Directive `"use client"` explicite quand nécessaire
- Props typées avec des interfaces

### Styling
- Tailwind CSS v4 — utilitaires uniquement, pas de CSS custom sauf `globals.css`
- `cn()` helper pour la fusion conditionnelle de classes (`clsx` + `tailwind-merge`)
- Design dark mode par défaut, accent violet `#7C3AED`
- Mobile-first responsive

### API Routes
- Validation Zod en entrée
- Toujours vérifier l'auth avant de traiter
- Error handling avec try/catch + réponses structurées
- Jamais de `console.log` en prod

### Naming
- Fichiers : `kebab-case` (ex: `score-gauge.tsx`, `analysis-engine.ts`)
- Composants : `PascalCase` (ex: `ScoreGauge`, `ResumeUploader`)
- Variables/fonctions : `camelCase`
- Types/Interfaces : `PascalCase`
- Constantes : `UPPER_SNAKE_CASE` pour les env vars uniquement

### Git
- Messages de commit : format conventionnel (`feat:`, `fix:`, `docs:`, `chore:`)
- Branch principale : `main`
- Chaque push sur `main` déclenche un deploy automatique sur Vercel

---

## Points d'attention techniques

### Webhook Stripe et domaine
Le domaine `resulift.cv` fait une redirection 307 vers `www.resulift.cv`. Stripe ne suit pas les redirections. Le webhook DOIT pointer vers `https://www.resulift.cv/api/webhooks/stripe`. Le middleware doit exclure `/api/*` des redirections.

### pdf-parse version
**JAMAIS upgrader pdf-parse au-delà de 1.1.1.** La v2 nécessite `@napi-rs/canvas` qui ne fonctionne pas sur Vercel serverless (erreur `DOMMatrix is not defined`).

### Timeout des analyses
Si l'API Claude timeout ou échoue, le status doit passer à `failed` (pas rester en `processing` indéfiniment). Le client poll pendant max 3 minutes avant d'afficher un message d'erreur.

---

## Ce qui est actif vs optionnel

| Service | Status | Notes |
|---|---|---|
| Supabase (DB + Auth + Storage) | ✅ Actif | - |
| Stripe (paiements) | ✅ Actif (mode test) | Passer en live pour vrais paiements |
| Anthropic Claude API | ✅ Actif | Crédits prépayés nécessaires |
| Resend (emails) | ✅ Actif | Domaine vérifié resulift.cv |
| Vercel Analytics | ✅ Actif | @vercel/analytics intégré |
| Upstash (rate limiting) | ⏸️ Optionnel | Clés placeholder, app fonctionne sans |
| Google OAuth | ⏸️ Préparé | Code prêt, pas configuré côté Supabase |

---

## Prochaines étapes possibles

- Passer Stripe en mode live
- Configurer Google OAuth dans Supabase
- Activer Upstash pour le rate limiting
- Soumettre sitemap sur Google Search Console
- Plan abonnement $19/mois (analyses illimitées 30 jours)
- Tracking des candidatures (tableau kanban)
- Comparaison d'analyses side-by-side
- Intégration LinkedIn (import profil)
