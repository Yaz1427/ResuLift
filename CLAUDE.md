# CLAUDE.md — ResuLift

## Projet

ResuLift est un micro-SaaS qui analyse les CV contre des descriptions de poste (job descriptions) et donne un score de compatibilité ATS (0-100) avec des recommandations concrètes d'optimisation. Business model pay-per-analysis : Basic à $5, Premium à $12.

- **URL de production** : https://resulift.cv
- **Repo** : https://github.com/Yaz1427/ResuLift
- **Hébergement** : Vercel (projet `resu-lift-jsc2`)
- **Base de données** : Supabase (projet `rrplwoztvfjnotgrswbb`, région eu-west-3 Paris)

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
| Parsing CV | pdf-parse (PDF) + mammoth (DOCX) | - |
| Emails | Resend | 6.x |
| Validation | Zod | v4 |
| State | Zustand | 5.x |
| Animations | Framer Motion | 12.x |
| PDF export | jsPDF + html2canvas | - |
| Rate limiting | Upstash (Redis + ratelimit) | - |
| Deploy | Vercel | - |
| Domaine | resulift.cv (Porkbun) | - |

---

## Architecture & Structure des fichiers

```
resulift/
├── middleware.ts                    # Auth middleware — protège /dashboard/*
├── src/
│   ├── app/
│   │   ├── (auth)/                 # Routes publiques auth
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── auth/callback/route.ts   # OAuth callback
│   │   ├── (marketing)/            # Landing page & pricing (publiques)
│   │   │   ├── page.tsx            # Landing page (/)
│   │   │   ├── pricing/page.tsx
│   │   │   └── layout.tsx
│   │   ├── dashboard/              # Routes protégées (auth required)
│   │   │   ├── page.tsx            # Vue d'ensemble + stats + historique
│   │   │   ├── new/page.tsx        # Stepper 3 étapes nouvelle analyse
│   │   │   ├── analysis/[id]/page.tsx  # Résultat d'une analyse
│   │   │   ├── settings/page.tsx   # Paramètres compte + langue
│   │   │   └── layout.tsx          # Sidebar dashboard
│   │   ├── api/
│   │   │   ├── analysis/           # Endpoint analyse IA + polling status
│   │   │   ├── auth/               # Auth helpers
│   │   │   ├── checkout/route.ts   # Crée Stripe Checkout Session
│   │   │   ├── upload/route.ts     # Upload CV vers Supabase Storage
│   │   │   └── webhooks/stripe/route.ts  # Webhook Stripe
│   │   ├── layout.tsx              # Root layout
│   │   ├── error.tsx               # Error boundary
│   │   ├── not-found.tsx           # 404
│   │   ├── robots.ts               # SEO
│   │   ├── sitemap.ts              # SEO
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # Composants shadcn/base-ui
│   │   ├── analysis/               # Composants spécifiques analyse
│   │   │   ├── score-gauge.tsx     # Gauge circulaire animée du score
│   │   │   ├── category-card.tsx   # Carte par catégorie de score
│   │   │   ├── recommendations-list.tsx
│   │   │   ├── optimized-bullets.tsx  # [PREMIUM] Bullet points réécrits
│   │   │   └── resume-uploader.tsx # Drag & drop upload
│   │   └── shared/                 # Navbar, Footer, Loading
│   ├── lib/
│   │   ├── analysis-engine.ts      # Moteur d'analyse — appelle Claude API
│   │   ├── prompts.ts              # Prompts IA (basic + premium)
│   │   ├── resume-parser.ts        # Parse PDF/DOCX → texte brut
│   │   ├── pdf-generator.ts        # Génère le rapport PDF téléchargeable
│   │   ├── stripe.ts               # Client Stripe
│   │   ├── email.ts                # Service d'envoi email
│   │   ├── emails/                 # Templates email (welcome, receipt, etc.)
│   │   ├── i18n.ts                 # Système i18n (FR, EN, العربية)
│   │   ├── lang-detect.ts          # Détection de langue du CV
│   │   ├── supabase/
│   │   │   ├── client.ts           # Client browser (createBrowserClient)
│   │   │   ├── server.ts           # Client serveur (createServerClient)
│   │   │   └── middleware.ts       # Client middleware
│   │   ├── validations.ts          # Schemas Zod
│   │   ├── button-variants.ts      # CVA variants pour les boutons
│   │   └── utils.ts                # Helpers (cn, formatDate, etc.)
│   ├── hooks/
│   │   └── use-analysis.ts         # Hook custom pour les analyses
│   └── types/
│       ├── analysis.ts             # Types AnalysisResult, CategoryResult, etc.
│       ├── database.ts             # Types Supabase (Profile, Analysis, Payment)
│       └── index.ts                # Re-exports
├── supabase/
│   └── schema.sql                  # Schema complet (3 tables + RLS + triggers)
└── public/
```

---

## Base de données (Supabase)

### Tables

**`profiles`** — Extension de auth.users
- `id` (uuid, PK, FK → auth.users)
- `email`, `full_name`, `credits`, `plan` (free/basic/premium)
- `stripe_customer_id` (unique)
- Trigger auto-création à l'inscription

**`analyses`** — Résultats des analyses
- `id` (uuid, PK)
- `user_id` (FK → profiles)
- `type` (basic/premium), `status` (pending/processing/completed/failed)
- `resume_url`, `resume_filename`, `job_title`, `job_company`, `job_description`
- `ats_score` (0-100), `result` (JSONB — résultat complet de l'analyse)

**`payments`** — Historique des paiements
- `id` (uuid, PK)
- `user_id` (FK → profiles), `analysis_id` (FK → analyses)
- `stripe_session_id` (unique), `stripe_payment_intent_id`
- `amount` (en centimes), `currency`, `status`

### Row Level Security (RLS)
- Activé sur toutes les tables
- Chaque user ne voit/modifie que SES propres données
- Le service_role bypass RLS pour les webhooks Stripe

---

## Flux principaux

### Flow d'analyse (cœur du produit)
1. User upload CV (PDF/DOCX) → `POST /api/upload` → Supabase Storage
2. User colle la job description + choisit Basic/Premium
3. `POST /api/checkout` → crée Stripe Checkout Session avec metadata
4. Redirect vers Stripe Checkout → paiement
5. Webhook `checkout.session.completed` → `POST /api/webhooks/stripe`
6. Le webhook déclenche l'analyse : parse CV → appel Claude API → sauvegarde résultat
7. Frontend poll `GET /api/analysis/[id]/status` jusqu'à `completed`
8. Affichage du résultat avec score, catégories, recommandations

### Flow d'authentification
- Supabase Auth (email/password + Google OAuth possible)
- Middleware Next.js protège toutes les routes `/dashboard/*`
- Refresh automatique du token via `@supabase/ssr`

### Flow de paiement
- Pay-per-analysis (pas d'abonnement)
- Stripe Checkout Sessions (pas de formulaire de carte custom)
- Webhook vérifie la signature Stripe avant de lancer l'analyse
- Jamais d'analyse sans paiement confirmé

---

## Moteur d'analyse IA

### Modèle : claude-sonnet-4-20250514

### Scoring (5 catégories, pondération fixe)
- Keywords Match — 30%
- Skills Alignment — 25%
- Experience Relevance — 20%
- Format & Structure — 15%
- Impact Statements — 10%

### Basic ($5)
- Score ATS global (0-100) + breakdown par catégorie
- Liste des keywords trouvés vs manquants
- Recommandations priorisées (High/Medium/Low)
- Rapport PDF téléchargeable

### Premium ($12)
- Tout le Basic +
- Réécriture IA de chaque bullet point du CV
- Suggestions d'intégration des keywords manquants
- Analyse du gap profil actuel vs profil idéal

### Output
- Le prompt force un output JSON strictement structuré
- Validé par Zod avant sauvegarde
- Stocké dans `analyses.result` (JSONB)

---

## Stripe

- **Mode** : Test (clés `sk_test_` / `pk_test_`)
- **Produit Basic** : `prod_UCEl5yF2vC6JyE` → Prix : `price_1TDqI3E2AJVBZrpRQGHGI4fy` ($5)
- **Produit Premium** : `prod_UCEl058NxZ3UYK` → Prix : `price_1TDqIBE2AJVBZrpRSFyn7qXZ` ($12)
- **Webhook** : `https://resulift.cv/api/webhooks/stripe`
- **Events écoutés** : `checkout.session.completed`, `checkout.session.expired`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- **Carte de test** : `4242 4242 4242 4242` (n'importe quelle date future, n'importe quel CVC)

---

## i18n

Système i18n custom dans `src/lib/i18n.ts`. Trois langues supportées :
- 🇫🇷 Français (par défaut)
- 🇬🇧 English
- 🇩🇿 العربية (Arabe)

Le choix de langue est dans `/dashboard/settings`. Stocké en localStorage.

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

# Resend (optionnel pour le dev)
RESEND_API_KEY=

# Upstash (optionnel pour le dev)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000  # ou https://resulift.cv en prod
```

⚠️ Le `.env.local` n'est JAMAIS commité. Il est dans `.gitignore`.

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
- Validation des inputs avec Zod (`src/lib/validations.ts`)

### Composants React
- **Server Components par défaut** — Client Components uniquement pour l'interactivité
- Directive `"use client"` explicite quand nécessaire
- Props typées avec des interfaces (pas de `type` inline)

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

## Ce qui est skippé / placeholder

- **Resend** : `RESEND_API_KEY=re_placeholder` — les emails ne partent pas encore. L'app fonctionne sans.
- **Upstash** : `UPSTASH_*=placeholder` — le rate limiting n'est pas actif. L'app fonctionne sans.
- **Google OAuth** : le code est prêt mais pas configuré côté Supabase. Seul email/password fonctionne.
- **Stripe Live** : actuellement en mode test. Pour passer en prod → remplacer les clés par les clés live + créer de nouveaux produits/prix.

---

## Prochaines étapes possibles

- Configurer Resend avec un vrai domaine pour les emails transactionnels
- Activer Google OAuth dans Supabase Auth
- Ajouter un plan abonnement ($19/mois) pour les chercheurs d'emploi actifs
- Tracking des candidatures (feature de rétention)
- Passer Stripe en mode live pour accepter de vrais paiements
- Ajouter Google Search Console + soumettre le sitemap pour l'indexation
- Analytics (Vercel Analytics ou Plausible)
