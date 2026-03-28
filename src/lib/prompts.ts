import type { AnalysisType, AnalysisResult, SeniorityLevel } from '@/types/analysis'

// Country-specific CV norms (Claude already knows these, but explicit context improves accuracy)
const COUNTRY_NORMS: Record<string, string> = {
  fr: 'France — CV 1-2 pages, photo bienvenue, coordonnées complètes, structure chronologique inversée, compétences linguistiques importantes.',
  be: 'Belgique — similaire France, 1-2 pages, photo recommandée, bilingue FR/NL valorisé.',
  ch: 'Suisse — 1-2 pages, photo standard, multilinguisme très valorisé (FR/DE/EN), très structuré.',
  ca: 'Canada — 1-2 pages, PAS de photo, PAS d\'âge ni date de naissance, bilinguisme FR/EN valorisé.',
  ma: 'Maroc — 1-2 pages, photo courante, trilinguisme AR/FR/EN valorisé.',
  dz: 'Algérie — 1-2 pages, trilinguisme AR/FR/EN attendu.',
  tn: 'Tunisie — 1-2 pages, compétences multilingues valorisées.',
  us: 'United States — Resume 1 page (junior/mid) or 1-2 pages (senior+), NO photo, NO date of birth/age/marital status, focus on quantified results, strong action verbs.',
  gb: 'United Kingdom — CV max 2 pages, no photo, no personal information (age, marital status), focus on achievements.',
  de: 'Deutschland — Lebenslauf 2 Seiten, professionelles Foto obligatorisch, vollständige Personalien, Bildungsabschlüsse sehr wichtig.',
  es: 'España — CV 2 páginas, foto habitual, información personal estándar.',
  ae: 'UAE — 1-2 pages, professional photo recommended, English essential, multinational experience highly valued.',
  sa: 'Saudi Arabia — 2 pages, nationality mentioned, Arabic/English bilingual, professional tone.',
}

const SENIORITY_CONTEXT: Record<SeniorityLevel, string> = {
  intern:  'INTERN/APPRENTICE profile: prioritize academic projects, coursework, extracurriculars, and potential over experience. Be lenient on work experience gaps.',
  junior:  'JUNIOR profile (0-2 years): recent graduate or career starter. Value education, personal projects, and first jobs. Less demanding on years of experience.',
  mid:     'MID-LEVEL profile (2-5 years): concrete domain experience, demonstrated autonomy, visible career progression between positions.',
  senior:  'SENIOR profile (5-10 years): deep technical or functional expertise, technical/functional leadership, measurable impact on significant projects.',
  lead:    'LEAD/EXPERT profile (10+ years): technical/business vision, team mentoring, significant contributions (open source, publications, talks).',
  manager: 'MANAGER/DIRECTOR profile: team management skills, budget ownership, stakeholder relations, measurable business outcomes, strategy.',
}

export function buildAnalysisPrompt(
  resumeText: string,
  jobDescription: string,
  jobTitle: string | undefined,
  company: string | undefined,
  analysisType: AnalysisType,
  targetCountry?: string,
  seniorityLevel?: SeniorityLevel
): string {
  const countryNorm   = targetCountry   ? COUNTRY_NORMS[targetCountry]      : undefined
  const seniorityCtx  = seniorityLevel  ? SENIORITY_CONTEXT[seniorityLevel] : undefined

  const basePrompt = `You are an expert ATS (Applicant Tracking System) analyst and professional resume coach with 15+ years of experience. Analyze the resume against the job description and provide a comprehensive, actionable report.

## Job Details
${jobTitle ? `Job Title: ${jobTitle}` : ''}
${company ? `Company: ${company}` : ''}
${countryNorm  ? `Target Country/Market: ${countryNorm}`  : ''}
${seniorityCtx ? `Seniority Level: ${seniorityCtx}` : ''}

## Job Description
${jobDescription}

## Resume
${resumeText}

## Your Task
Perform a thorough ATS compatibility analysis. Be specific, honest, and actionable.

### Scoring Weights:
- Keywords Match: 30%
- Skills Alignment: 25%
- Experience Relevance: 20%
- Format & Structure: 15%
- Impact Statements: 10%

### Category Analysis Instructions:
1. **keywordsMatch**: Extract ALL keywords from the JD (hard skills, soft skills, tools, methodologies, certifications). List which are found vs missing in the resume.
2. **formatStructure**: Check for ATS-problematic elements (tables, columns, headers/footers, graphics, unusual fonts, missing sections like summary/experience/education/skills).
3. **experienceRelevance**: Evaluate how well the candidate's experience matches the JD requirements.
4. **skillsAlignment**: Compare technical and soft skills mentioned in JD vs resume.
5. **impactStatements**: Assess quality of bullet points — are they quantified? Do they use strong action verbs? Are they achievement-focused?

### Recommendations:
Generate 5-8 specific, actionable recommendations. Prioritize by impact (high/medium/low).

LANGUE: Tu dois écrire TOUT le contenu textuel en français. Sans exception. Les champs "summary", "feedback", "title", "description", "actionItem", "reasoning", "suggestedPlacement", "exampleUsage", "profileGapAnalysis" et tous les éléments des tableaux "found", "missing", "recommendations" doivent être rédigés en français. Seules les clés JSON restent en anglais.

You MUST respond with ONLY valid JSON matching this exact schema — no markdown, no explanation, no code blocks, just raw JSON:

{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence executive summary of the analysis>",
  "categories": {
    "keywordsMatch": {
      "score": <number 0-100>,
      "found": [<array of keyword strings found in resume>],
      "missing": [<array of keyword strings missing from resume>],
      "feedback": "<specific feedback about keyword coverage>"
    },
    "formatStructure": {
      "score": <number 0-100>,
      "found": [<array of good formatting elements detected>],
      "missing": [<array of missing or problematic elements>],
      "feedback": "<specific feedback about ATS format compatibility>"
    },
    "experienceRelevance": {
      "score": <number 0-100>,
      "found": [<array of relevant experience points>],
      "missing": [<array of experience gaps>],
      "feedback": "<specific feedback about experience match>"
    },
    "skillsAlignment": {
      "score": <number 0-100>,
      "found": [<array of matching skills>],
      "missing": [<array of missing required skills>],
      "feedback": "<specific feedback about skills match>"
    },
    "impactStatements": {
      "score": <number 0-100>,
      "found": [<array of strong impact statements or quantified achievements>],
      "missing": [<array of weak bullet points that need improvement>],
      "feedback": "<specific feedback about bullet point quality>"
    }
  },
  "recommendations": [
    {
      "id": "<unique string id>",
      "impact": "<'high' | 'medium' | 'low'>",
      "category": "<category name>",
      "title": "<short recommendation title>",
      "description": "<why this matters>",
      "actionItem": "<specific action to take>"
    }
  ]
}`

  const premiumAddition = `

${analysisType === 'premium' ? `,
  "optimizedBulletPoints": [
    {
      "original": "<original bullet point from resume>",
      "optimized": "<rewritten version with keywords integrated, stronger verbs, quantified if possible>",
      "reasoning": "<brief explanation of changes made>"
    }
  ],
  "missingKeywordsIntegration": [
    {
      "keyword": "<missing keyword>",
      "relevance": "<'critical' | 'important' | 'nice-to-have'>",
      "suggestedPlacement": "<where in the resume to add this>",
      "exampleUsage": "<example sentence showing natural integration>"
    }
  ],
  "profileGapAnalysis": "<2-3 paragraph analysis of the gap between current profile and ideal candidate profile, with specific suggestions to close the gap>"` : ''}

IMPORTANT for Premium: Rewrite ALL bullet points from the Experience section of the resume. Integrate missing keywords naturally. Every rewrite must be stronger, more specific, and more impactful than the original.

Respond with ONLY the JSON object. The JSON must be complete and valid.`

  if (analysisType === 'premium') {
    // Replace last closing brace to add premium fields
    return basePrompt.replace(/\}$/, `${premiumAddition}\n}`)
  }

  return basePrompt
}

export function buildGenerateCVPrompt(
  resumeText: string,
  jobDescription: string,
  jobTitle: string | undefined,
  company: string | undefined,
  analysisResult: AnalysisResult
): string {
  const optimizedBullets = analysisResult.optimizedBulletPoints
    ? analysisResult.optimizedBulletPoints.map(b => `ORIGINAL: ${b.original}\nOPTIMIZÉ: ${b.optimized}`).join('\n\n')
    : ''

  const missingKeywords = analysisResult.categories.keywordsMatch.missing.slice(0, 15).join(', ')

  return `Tu es un extracteur de données de CV. Tu lis le CV original et tu le restructures en JSON STRICT pour un rendu PDF automatique.

## CONTRAINTE CRITIQUE — LONGUEUR DES TEXTES
Le PDF fait 1 page A4. Chaque ligne fait ~105 caractères max. RESPECTE CES LIMITES :
- Chaque bullet point : **90 caractères MAX** — UNE SEULE LIGNE, pas plus
- Résumé (summary) : **200 caractères MAX** au total (2 phrases courtes)
- Chaque compétence : 1-3 mots max (ex: "Python", "Machine Learning", "FastAPI")
Si un bullet dépasse 90 caractères, RACCOURCIS-LE. Supprime les mots inutiles. Va à l'essentiel.

## EXEMPLES DE BONS BULLETS (≤90 chars)
✅ "Développé un système IA de supervision pour 15+ automates industriels"
✅ "Implémenté une API REST FastAPI gérant 10K+ requêtes/seconde"
✅ "Automatisé le traitement de 1000+ échantillons/sec avec Python/NumPy"
✅ "Réduit les temps d'intervention de 40% via optimisation des processus"
✅ "Déployé des modèles deep learning pour détection d'anomalies (−30% arrêts)"

## EXEMPLES DE MAUVAIS BULLETS (TROP LONGS — INTERDIT)
❌ "Développé un système d'automatisation par IA pour supervision d'automates industriels, intégrant des algorithmes de machine learning pour l'analyse prédictive et la détection d'anomalies sur 10 000+ points de données temps réel, réduisant les temps d'intervention de 40%"

## Poste visé
${jobTitle ? `Intitulé : ${jobTitle}` : ''}
${company ? `Entreprise : ${company}` : ''}

## Description du poste
${jobDescription}

## CV original
${resumeText}

## Bullet points optimisés par l'analyse précédente
${optimizedBullets || 'Aucun'}

## Mots-clés manquants à intégrer
${missingKeywords || 'Aucun'}

## Règles d'extraction
1. GARDE TOUTES les expériences, formations, compétences, langues du CV original
2. AMÉLIORE chaque bullet : [Verbe d'action] + [quoi] + [impact chiffré] — EN ≤90 CARACTÈRES
3. Si un bullet original contient 2-3 idées, SÉPARE-LES en 2-3 bullets courts
4. NE JAMAIS inventer de faits, entreprises, dates ou chiffres
5. Trie les compétences par pertinence pour le poste
6. TOUT en français
7. 3 bullets max par expérience (les plus impactants)
8. Compétences : 15 max (les plus pertinentes pour le poste d'abord)

Réponds UNIQUEMENT avec du JSON valide :

{
  "fullName": "string",
  "contact": {
    "email": "string|null",
    "phone": "string|null",
    "location": "string|null",
    "linkedin": "string|null",
    "website": "string|null"
  },
  "summary": "string (≤200 chars, 2 phrases courtes)",
  "experience": [
    {
      "company": "string",
      "position": "string",
      "dates": "string",
      "bullets": ["string ≤90 chars", "string ≤90 chars", "string ≤90 chars"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "school": "string",
      "year": "string|null"
    }
  ],
  "skills": ["string", "string", "...max 15"],
  "languages": [
    { "name": "string", "level": "string" }
  ]
}`
}
